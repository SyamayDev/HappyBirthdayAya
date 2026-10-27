import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import styles from './Lightbox.module.css'

/*
 * Full-size photo viewer on a native <dialog> (focus containment, Escape,
 * inert background are provided by the browser). Escape and backdrop
 * clicks close it; arrows, buttons and swipes move between photos.
 */
export function Lightbox({ photos, index, onIndexChange, onClose }) {
  const dialogRef = useRef(null)
  const dragRef = useRef(null)
  const indexRef = useRef(index)
  const count = photos.length
  const photo = photos[index]

  useScrollLock(true)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  const move = (delta) => onIndexChange((index + delta + count) % count)

  function handleCancel(event) {
    event.preventDefault()
    onClose(indexRef.current)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    }
  }

  function handlePointerUp(event) {
    const start = dragRef.current
    dragRef.current = null
    if (!start) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - start.y)) move(dx < 0 ? 1 : -1)
  }

  return (
    // The dialog itself is the backdrop area: a click that lands on it (not on
    // the photo or the controls) closes the viewer. Keyboard users have Escape
    // and the close button.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={`Foto ${index + 1} dari ${count}`}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(index)
      }}
    >
      <div className={styles.frame}>
        <header className={styles.bar}>
          <p className={styles.counter}>
            {index + 1} / {count}
          </p>
          <button type="button" className={styles.close} aria-label="Tutup" onClick={() => onClose(index)}>
            <X aria-hidden="true" />
          </button>
        </header>

        <figure
          className={styles.figure}
          onPointerDown={(event) => {
            dragRef.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragRef.current = null
          }}
        >
          <LightboxImage key={photo.src} photo={photo} />
          <figcaption className={styles.caption}>{photo.alt}</figcaption>
        </figure>

        <div className={styles.nav}>
          <button type="button" className={styles.navButton} aria-label="Foto sebelumnya" onClick={() => move(-1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className={styles.navButton} aria-label="Foto berikutnya" onClick={() => move(1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </dialog>
  )
}

function LightboxImage({ photo }) {
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  return (
    <div className={styles.imageBox} style={{ aspectRatio: `${photo.width} / ${photo.height}` }} data-status={status}>
      {status === 'error' ? (
        <div className={styles.error} role="alert">
          <p>Foto gagal dimuat.</p>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              setStatus('loading')
              setAttempt((value) => value + 1)
            }}
          >
            <RefreshCw aria-hidden="true" />
            Coba lagi
          </button>
        </div>
      ) : (
        <img
          key={attempt}
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          decoding="async"
          draggable="false"
          className={styles.image}
          onLoad={() => setStatus('loaded')}
          onError={() => {
            if (import.meta.env.DEV) console.warn(`[Lightbox] failed to load ${photo.src}`)
            setStatus('error')
          }}
        />
      )}
    </div>
  )
}
