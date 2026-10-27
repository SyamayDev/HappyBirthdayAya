import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue } from 'motion/react'
import { home, photos } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { usePageVisible } from '../../hooks/usePageVisible.js'
import { Lightbox } from '../../components/Lightbox/Lightbox.jsx'
import styles from './PhotoRing.module.css'

/*
 * The original rotating ring of photos, seen from INSIDE the ring (the
 * centre photo is farthest away, the sides curve towards you) — kept
 * exactly as a concept, but now it can be dragged/swiped, each photo opens
 * full size, keyboard focus turns the ring to that photo, and it pauses
 * when the tab is hidden, the book is open, or motion should be reduced.
 */

const COUNT = photos.length
const STEP = 360 / COUNT
const SECONDS_PER_TURN = 32 // same pace as the original

export function PhotoRing({ paused = false }) {
  const reduced = useReducedMotionPreference()
  const visible = usePageVisible()
  const angle = useMotionValue(0)
  const [viewer, setViewer] = useState(null)
  const [focused, setFocused] = useState(false)
  const dragRef = useRef(null)
  const suppressClickRef = useRef(false)
  const restoreFocusRef = useRef(null)

  const spinning = !reduced && !paused && visible && viewer === null && !focused

  useEffect(() => {
    if (!spinning) return undefined
    let frame = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      if (!dragRef.current?.active) angle.set(angle.get() - (360 / SECONDS_PER_TURN) * dt)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [spinning, angle])

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    dragRef.current = { startX: event.clientX, startY: event.clientY, startAngle: angle.get(), active: false }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    if (!drag.active && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - drag.startY)) drag.active = true
    if (drag.active) angle.set(drag.startAngle + dx * 0.35)
  }

  function handlePointerEnd() {
    if (dragRef.current?.active) suppressClickRef.current = true
    dragRef.current = null
  }

  function faceCard(index) {
    // Bring the photo to the centre, taking the shortest way round.
    const target = -index * STEP
    const current = angle.get()
    const delta = ((((target - current) % 360) + 540) % 360) - 180
    angle.set(current + delta)
  }

  function openViewer(event, index) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    restoreFocusRef.current = event.currentTarget
    setViewer(index)
  }

  return (
    <section className={styles.wrap} aria-label={home.ringLabel}>
      <div
        className={styles.scene}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        <motion.div className={styles.ring} style={{ rotateY: angle, '--n': COUNT }}>
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className={styles.card}
              style={{ '--i': index }}
              aria-label={`Lihat foto ${index + 1}: ${photo.alt}`}
              onClick={(event) => openViewer(event, index)}
              onFocus={() => {
                setFocused(true)
                faceCard(index)
              }}
              onBlur={() => setFocused(false)}
            >
              <img
                src={photo.thumb}
                alt=""
                width={600}
                height={Math.round((600 * photo.height) / photo.width)}
                draggable="false"
                decoding="async"
                style={{ objectPosition: photo.focus }}
              />
            </button>
          ))}
        </motion.div>
      </div>

      {viewer !== null ? (
        <Lightbox
          photos={photos}
          index={viewer}
          onIndexChange={setViewer}
          onClose={() => {
            setViewer(null)
            restoreFocusRef.current?.focus({ preventScroll: true })
          }}
        />
      ) : null}
    </section>
  )
}
