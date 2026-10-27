import { useEffect, useRef } from 'react'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import styles from './HeartTrail.module.css'

/*
 * The original "heart trail": hearts float up from the mouse pointer.
 * The old script appended a new <span> with an external image on every
 * mousemove; here a fixed pool of hearts is recycled with the Web
 * Animations API. Mouse/pen only (as before), off with reduced motion.
 */

const POOL_SIZE = 18
const MIN_DISTANCE = 18

export function HeartTrail() {
  const reduced = useReducedMotionPreference()
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const active = finePointer && !reduced
  const itemsRef = useRef([])

  useEffect(() => {
    if (!active) return undefined
    const items = itemsRef.current.filter(Boolean)
    if (items.length === 0 || typeof items[0].animate !== 'function') return undefined

    let next = 0
    let frame = 0
    let pending = null
    let lastX = -1000
    let lastY = -1000
    const animations = new Set()

    function spawn() {
      frame = 0
      if (!pending) return
      const { x, y } = pending
      pending = null
      if (Math.hypot(x - lastX, y - lastY) < MIN_DISTANCE) return
      lastX = x
      lastY = y
      const element = items[next]
      const size = 0.55 + ((next * 7) % 10) / 10
      const drift = ((next * 37) % 60) - 30
      next = (next + 1) % items.length
      const animation = element.animate(
        [
          { transform: `translate(${x}px, ${y}px) scale(${size * 0.4}) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${x + drift}px, ${y - 90}px) scale(${size}) rotate(${drift}deg)`, opacity: 0 },
        ],
        { duration: 1300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
      )
      animations.add(animation)
      animation.onfinish = () => animations.delete(animation)
    }

    function onPointerMove(event) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      pending = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(spawn)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(frame)
      animations.forEach((animation) => animation.cancel())
      animations.clear()
    }
  }, [active])

  if (!active) return null

  return (
    <div className={styles.layer} aria-hidden="true">
      {Array.from({ length: POOL_SIZE }, (_, index) => (
        <span
          key={index}
          ref={(element) => {
            itemsRef.current[index] = element
          }}
          className={`${styles.heart} ${styles[`tone${index % 3}`]}`}
        />
      ))}
    </div>
  )
}
