import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { MotionConfig } from 'motion/react'

/*
 * Follows the visitor's "reduce motion" system setting. The result drives
 * <MotionConfig> for every `motion` component, <html data-motion> for CSS
 * (see globals.css), and `reduced` for JS effects (confetti, 3D, page wipe).
 * `initialPreference` ('system' | 'reduced' | 'full') is used by tests.
 */

const QUERY = '(prefers-reduced-motion: reduce)'
const MotionPreferenceContext = createContext(null)

function subscribe(onChange) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSystemReduced() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches
}

export function MotionPreferenceProvider({ children, initialPreference = 'system' }) {
  const systemReduced = useSyncExternalStore(subscribe, getSystemReduced, () => false)
  const reduced = initialPreference === 'system' ? systemReduced : initialPreference === 'reduced'

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
  }, [reduced])

  const value = useMemo(() => ({ reduced }), [reduced])

  return (
    <MotionPreferenceContext.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </MotionPreferenceContext.Provider>
  )
}

export function useReducedMotionPreference() {
  const context = useContext(MotionPreferenceContext)
  if (!context) throw new Error('useReducedMotionPreference must be used inside <MotionPreferenceProvider>')
  return context.reduced
}
