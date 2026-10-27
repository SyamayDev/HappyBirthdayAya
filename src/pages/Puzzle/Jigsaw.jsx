import { memo, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { cx } from '../../lib/cx.js'
import { KNOB_DEPTH, clamp, computeLayout, createEdges, isNearHome, piecePath, pieceSides, scatterPositions } from './jigsaw.js'
import styles from './Jigsaw.module.css'

/*
 * A real jigsaw (knobbed pieces) like the original page, rebuilt for every
 * device: pieces are dragged with Pointer Events (mouse, pen and touch),
 * snap into place near their slot, keep their relative positions when the
 * screen rotates, and can be placed with the keyboard (Enter) as well.
 *
 * Positions are stored normalised to the play area (0..1), so a resize or
 * an orientation change never strands pieces off-screen.
 */

const Piece = memo(function Piece({ id, row, col, cols, rows, size, pad, path, image, x, y, z, placed, dragging, instant, onPointerDown, onPlace, label }) {
  const clipId = useId().replace(/:/g, '')
  const box = size + pad * 2
  return (
    <motion.svg
      className={cx(styles.piece, placed && styles.placed, dragging && styles.dragging)}
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      style={{ zIndex: z }}
      initial={false}
      animate={{ x: x - pad, y: y - pad }}
      transition={instant ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
      role="button"
      tabIndex={placed ? -1 : 0}
      aria-label={label}
      aria-disabled={placed || undefined}
      onKeyDown={(event) => {
        if (!placed && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onPlace(id)
        }
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image href={image} x={pad - col * size} y={pad - row * size} width={cols * size} height={rows * size} preserveAspectRatio="xMidYMid slice" />
        <path d={path} className={styles.bevel} />
      </g>
      <path d={path} className={styles.hit} onPointerDown={placed ? undefined : (event) => onPointerDown(id, event)} />
    </motion.svg>
  )
})

export function Jigsaw({ ref, image, cols, rows, status, peek, reduced, onProgress, onComplete }) {
  const areaRef = useRef(null)
  const [area, setArea] = useState({ width: 0, height: 0 })
  const count = cols * rows
  const [edges] = useState(() => createEdges(cols, rows))
  const [positions, setPositions] = useState(null) // normalised {x, y} per piece; null = at home
  const [placed, setPlaced] = useState(() => Array(count).fill(false))
  const [order, setOrder] = useState(() => Array.from({ length: count }, (_, i) => i)) // stacking
  const [drag, setDrag] = useState(null)
  const completeRef = useRef(false)

  // Measure the play area (and re-measure on resize / rotation).
  useEffect(() => {
    const element = areaRef.current
    if (!element) return undefined
    const measure = () => setArea({ width: element.clientWidth, height: element.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(() => (area.width ? computeLayout(area.width, area.height, cols, rows) : null), [area, cols, rows])
  const pad = layout ? Math.ceil(layout.size * (KNOB_DEPTH + 0.04)) : 0

  const pieces = useMemo(() => {
    if (!layout) return []
    return Array.from({ length: count }, (_, id) => {
      const row = Math.floor(id / cols)
      const col = id % cols
      const home = { x: layout.board.x + col * layout.size, y: layout.board.y + row * layout.size }
      return { id, row, col, home, path: piecePath(pieceSides(edges, cols, rows, row, col), layout.size, pad) }
    })
  }, [layout, edges, cols, rows, count, pad])

  const toPixels = (id) => {
    const piece = pieces[id]
    if (!positions || placed[id]) return piece.home
    return { x: positions[id].x * layout.width, y: positions[id].y * layout.height }
  }

  function place(id) {
    if (placed[id] || completeRef.current) return
    const next = placed.slice()
    next[id] = true
    setPlaced(next)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12)
    const done = next.filter(Boolean).length
    onProgress(done, count)
    if (done === count) {
      completeRef.current = true
      onComplete()
    }
  }

  // Commands from the toolbar (called from click handlers, not effects).
  useImperativeHandle(ref, () => ({
    scatter() {
      if (!layout) return
      const spots = scatterPositions(layout, count)
      setPositions((current) =>
        spots.map((spot, id) => (placed[id] && current ? current[id] : { x: spot.x / layout.width, y: spot.y / layout.height })),
      )
    },
    help() {
      const loose = placed.map((value, id) => (value ? -1 : id)).filter((id) => id >= 0)
      if (loose.length === 0) return
      const id = loose[Math.floor(Math.random() * loose.length)]
      setOrder((current) => [...current.filter((item) => item !== id), id])
      place(id)
    },
  }))

  function handlePointerDown(id, event) {
    if (status !== 'playing' || !layout) return
    event.preventDefault()
    const rect = areaRef.current.getBoundingClientRect()
    const start = toPixels(id)
    setOrder((current) => [...current.filter((item) => item !== id), id])
    setDrag({ id, pointerId: event.pointerId, offsetX: event.clientX - rect.left - start.x, offsetY: event.clientY - rect.top - start.y })
  }

  // Follow the pointer while dragging; snap or drop on release.
  useEffect(() => {
    if (!drag || !layout) return undefined
    const rect = areaRef.current.getBoundingClientRect()
    const knob = layout.size * KNOB_DEPTH
    const current = { ...toPixels(drag.id) }

    function onMove(event) {
      if (event.pointerId !== drag.pointerId) return
      current.x = clamp(event.clientX - rect.left - drag.offsetX, -knob * 0.5, layout.width - layout.size + knob * 0.5)
      current.y = clamp(event.clientY - rect.top - drag.offsetY, -knob * 0.5, layout.height - layout.size + knob * 0.5)
      setPositions((list) => {
        const next = list ? list.slice() : pieces.map((piece) => ({ x: piece.home.x / layout.width, y: piece.home.y / layout.height }))
        next[drag.id] = { x: current.x / layout.width, y: current.y / layout.height }
        return next
      })
    }

    function onUp(event) {
      if (event.pointerId !== drag.pointerId) return
      if (isNearHome(current, pieces[drag.id].home, layout.size)) place(drag.id)
      setDrag(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, layout])

  const placedCount = placed.filter(Boolean).length

  return (
    <div ref={areaRef} className={cx(styles.area, status === 'complete' && styles.complete)}>
      {layout ? (
        <>
          <div
            className={cx(styles.board, peek && styles.peek)}
            style={{ left: layout.board.x, top: layout.board.y, width: layout.board.w, height: layout.board.h, '--image': `url(${image})` }}
            aria-hidden="true"
          />
          {pieces.map((piece) => {
            const { x, y } = toPixels(piece.id)
            return (
              <Piece
                key={piece.id}
                id={piece.id}
                row={piece.row}
                col={piece.col}
                cols={cols}
                rows={rows}
                size={layout.size}
                pad={pad}
                path={piece.path}
                image={image}
                x={x}
                y={y}
                z={placed[piece.id] ? 1 : 10 + order.indexOf(piece.id)}
                placed={placed[piece.id]}
                dragging={drag?.id === piece.id}
                instant={reduced || drag?.id === piece.id}
                label={`Keping ${piece.id + 1}${placed[piece.id] ? ', sudah terpasang' : '. Seret ke tempatnya, atau tekan Enter untuk memasangnya'}`}
                onPointerDown={handlePointerDown}
                onPlace={place}
              />
            )
          })}
          <p className="visually-hidden" aria-live="polite">
            {placedCount > 0 ? `${placedCount} dari ${count} keping terpasang` : ''}
          </p>
        </>
      ) : null}
    </div>
  )
}
