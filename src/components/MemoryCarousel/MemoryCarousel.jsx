import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { ChevronLeft, ChevronRight, Cloud, Pause, Play } from 'lucide-react'
import { memories, photos } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { usePageVisible } from '../../hooks/usePageVisible.js'
import { Chapter, ChapterHeading } from '../common/Chapter.jsx'
import { Reveal } from '../common/Reveal.jsx'
import { cx } from '../../lib/cx.js'
import { Lightbox } from './Lightbox.jsx'
import styles from './MemoryCarousel.module.css'

/*
 * The legacy page spun these photos in a 3D ring nobody could control.
 * Here the ring is still the centrepiece, but it is navigable by buttons,
 * swipe, arrow keys and a photo rail; autoplay only runs while the ring is
 * on screen and untouched, and can be paused (WCAG 2.2.2).
 */

const COUNT = photos.length
const STEP = 360 / COUNT
// distance from the ring centre to each card, as a multiple of card width
const RADIUS_FACTOR = 1 / (2 * Math.tan(Math.PI / COUNT))
export const AUTOPLAY_MS = 4500

const mod = (value, n) => ((value % n) + n) % n

export function MemoryCarousel() {
  const reduced = useReducedMotionPreference()
  const pageVisible = usePageVisible()
  const regionRef = useRef(null)
  const inView = useInView(regionRef, { amount: 0.35 })

  const [turn, setTurn] = useState(0)
  const [autoplayOn, setAutoplayOn] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [liveText, setLiveText] = useState('')
  const [failed, setFailed] = useState({})

  const activeCardRef = useRef(null)
  const restoreFocusRef = useRef(false)
  const dragRef = useRef(null)
  const suppressClickRef = useRef(false)

  const index = mod(turn, COUNT)
  const autoplayAvailable = !reduced
  const running = autoplayAvailable && autoplayOn && inView && pageVisible && !hovered && !focusWithin && lightboxIndex === null

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => setTurn((value) => value + 1), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (lightboxIndex === null && restoreFocusRef.current) {
      restoreFocusRef.current = false
      activeCardRef.current?.focus({ preventScroll: true })
    }
  }, [lightboxIndex])

  function userMove(delta) {
    const nextIndex = mod(index + delta, COUNT)
    setTurn((value) => value + delta)
    setAutoplayOn(false)
    setLiveText(`Foto ${nextIndex + 1} dari ${COUNT}`)
  }

  function showIndex(target) {
    let delta = mod(target - index, COUNT)
    if (delta > COUNT / 2) delta -= COUNT
    if (delta !== 0) userMove(delta)
  }

  function handleKeyDown(event) {
    if (event.target.closest('input, textarea')) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      userMove(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      userMove(-1)
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    dragRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event) {
    const start = dragRef.current
    dragRef.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressClickRef.current = true
      userMove(dx < 0 ? 1 : -1)
    }
  }

  function handleClickCapture(event) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function handleCardClick(cardIndex) {
    if (cardIndex === index) {
      setAutoplayOn(false)
      setLightboxIndex(cardIndex)
    } else {
      showIndex(cardIndex)
    }
  }

  function closeLightbox(lastIndex) {
    restoreFocusRef.current = true
    showIndex(lastIndex)
    setLightboxIndex(null)
  }

  function markFailed(id) {
    if (import.meta.env.DEV) console.warn(`[MemoryCarousel] photo failed to load: ${id}`)
    setFailed((current) => ({ ...current, [id]: true }))
  }

  return (
    <Chapter id="kenangan" tone="dawn">
      <div className="container">
        <ChapterHeading id="kenangan" number={1} eyebrow={memories.eyebrow} title={memories.title} lead={memories.lead} />

        <Reveal>
          {/* Arrow keys anywhere inside the carousel region move between photos (APG carousel pattern). */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            ref={regionRef}
            className={styles.carousel}
            role="region"
            aria-roledescription="carousel"
            aria-label="Galeri kenangan Aya"
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocusWithin(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false)
            }}
          >
            <div
              className={styles.stage}
              style={{ '--k': RADIUS_FACTOR.toFixed(4) }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                dragRef.current = null
              }}
              onClickCapture={handleClickCapture}
            >
              <div className={styles.ring} style={{ '--turn': `${-turn * STEP}deg` }}>
                {photos.map((photo, cardIndex) => {
                  const active = cardIndex === index
                  return (
                    <div
                      key={photo.id}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${cardIndex + 1} dari ${COUNT}`}
                      aria-hidden={active ? undefined : true}
                      className={cx(styles.slide, active && styles.active)}
                      style={{ '--angle': `${cardIndex * STEP}deg` }}
                    >
                      <button
                        ref={active ? activeCardRef : undefined}
                        type="button"
                        className={styles.card}
                        tabIndex={active ? 0 : -1}
                        aria-label={`Lihat lebih besar: ${photo.alt}`}
                        onClick={() => handleCardClick(cardIndex)}
                      >
                        <span className={styles.photoBox}>
                          {failed[photo.id] ? (
                            <span className={styles.fallback}>
                              <Cloud aria-hidden="true" />
                              Foto tidak tersedia
                            </span>
                          ) : (
                            <img
                              src={photo.thumb}
                              alt=""
                              width={600}
                              height={Math.round((600 * photo.height) / photo.width)}
                              loading="lazy"
                              decoding="async"
                              draggable="false"
                              style={{ objectPosition: photo.focus }}
                              onError={() => markFailed(photo.id)}
                            />
                          )}
                        </span>
                        <span className={styles.caption} aria-hidden="true">
                          {String(cardIndex + 1).padStart(2, '0')}
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={styles.controls}>
              <button type="button" className="btn btn--icon" aria-label="Foto sebelumnya" onClick={() => userMove(-1)}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <p className={styles.counter}>
                Foto <span className={styles.counterNumber}>{index + 1}</span> dari {COUNT}
              </p>
              <button type="button" className="btn btn--icon" aria-label="Foto berikutnya" onClick={() => userMove(1)}>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>

            <ul className={styles.rail} aria-label="Pilih foto">
              {photos.map((photo, railIndex) => (
                <li key={photo.id}>
                  <button
                    type="button"
                    className={cx(styles.railButton, railIndex === index && styles.railActive)}
                    aria-label={`Tampilkan foto ${railIndex + 1}`}
                    aria-current={railIndex === index ? 'true' : undefined}
                    onClick={() => showIndex(railIndex)}
                  >
                    <img src={photo.thumb} alt="" loading="lazy" decoding="async" style={{ objectPosition: photo.focus }} />
                  </button>
                </li>
              ))}
            </ul>

            {autoplayAvailable ? (
              <button
                type="button"
                className={cx('btn btn--ghost btn--sm', styles.autoplay)}
                onClick={() => setAutoplayOn((value) => !value)}
              >
                {autoplayOn ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                {autoplayOn ? 'Jeda putar otomatis' : 'Putar otomatis'}
              </button>
            ) : null}

            <p className="visually-hidden" aria-live="polite" aria-atomic="true">
              {liveText}
            </p>
          </div>
        </Reveal>
      </div>

      {lightboxIndex !== null ? (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={closeLightbox}
        />
      ) : null}
    </Chapter>
  )
}
