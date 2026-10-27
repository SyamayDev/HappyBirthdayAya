import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CIRCLE, HEART } from '../lib/morphShapes.js'
import { setRoute } from '../lib/router.js'
import { useReducedMotionPreference } from './MotionPreference.jsx'

/*
 * Page changes use a "heart wipe": a heart grows from the button that was
 * pressed and MORPHS into a circle as it covers the screen; the next page
 * is swapped in underneath, then the circle shrinks back into a heart and
 * disappears in the middle of the screen. Reduced motion: instant change.
 */

const TransitionContext = createContext(null)
const SIZE = 160

function originFrom(event) {
  if (event?.clientX || event?.clientY) return { x: event.clientX, y: event.clientY }
  const rect = event?.currentTarget?.getBoundingClientRect?.()
  if (rect) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

function coverScale(x, y) {
  const w = window.innerWidth
  const h = window.innerHeight
  const farthest = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))
  return ((farthest * 2) / SIZE) * 1.12
}

export function TransitionProvider({ children }) {
  const reduced = useReducedMotionPreference()
  const [wipe, setWipe] = useState(null) // { id, phase: 'cover'|'reveal', x, y, scale, route }
  const busyRef = useRef(false)

  const navigate = useCallback(
    (route, event) => {
      if (busyRef.current) return
      if (reduced) {
        setRoute(route)
        return
      }
      busyRef.current = true
      const { x, y } = originFrom(event)
      setWipe({ id: Date.now(), phase: 'cover', x, y, scale: coverScale(x, y), route })
    },
    [reduced],
  )

  function handleCovered() {
    setRoute(wipe.route)
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    setWipe((current) => (current ? { ...current, phase: 'reveal', x, y, scale: coverScale(x, y) } : current))
  }

  function handleRevealed() {
    busyRef.current = false
    setWipe(null)
  }

  const value = useMemo(() => ({ navigate }), [navigate])

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {wipe ? (
          <div key={wipe.id} className="heart-wipe" aria-hidden="true">
            <motion.svg
              key={wipe.phase}
              className="heart-wipe__shape"
              viewBox="0 0 100 100"
              style={{ left: wipe.x - SIZE / 2, top: wipe.y - SIZE / 2, width: SIZE, height: SIZE }}
              initial={wipe.phase === 'cover' ? { scale: 0, rotate: -12 } : { scale: wipe.scale, rotate: 0 }}
              animate={wipe.phase === 'cover' ? { scale: wipe.scale, rotate: 0 } : { scale: 0, rotate: 10 }}
              transition={{ duration: wipe.phase === 'cover' ? 0.75 : 0.65, ease: [0.65, 0, 0.35, 1] }}
              onAnimationComplete={wipe.phase === 'cover' ? handleCovered : handleRevealed}
            >
              <defs>
                <linearGradient id="heart-wipe-fill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#8fd0ff" />
                  <stop offset="0.55" stopColor="#3f9bf8" />
                  <stop offset="1" stopColor="#2161c4" />
                </linearGradient>
              </defs>
              <motion.path
                fill="url(#heart-wipe-fill)"
                initial={{ d: wipe.phase === 'cover' ? HEART : CIRCLE }}
                animate={{ d: wipe.phase === 'cover' ? CIRCLE : HEART }}
                transition={{ duration: wipe.phase === 'cover' ? 0.75 : 0.65, ease: [0.65, 0, 0.35, 1] }}
              />
            </motion.svg>
          </div>
        ) : null}
      </AnimatePresence>
    </TransitionContext.Provider>
  )
}

export function usePageTransition() {
  const context = useContext(TransitionContext)
  if (!context) throw new Error('usePageTransition must be used inside <TransitionProvider>')
  return context
}
