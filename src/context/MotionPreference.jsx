import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { MotionConfig } from 'motion/react'
import { readStorage, writeStorage } from '../lib/storage.js'

/*
 * Reduced-motion preference = the OS setting, unless the visitor overrides
 * it with the in-app toggle ("Animasi hemat"). The result drives:
 *   • <MotionConfig reducedMotion> for every `motion` component,
 *   • <html data-motion="reduced|full"> for CSS (see globals.css),
 *   • `reduced` for JS-driven effects (confetti, autoplay, 3D intro, …).
 */

const STORAGE_KEY = 'motion-preference'
const QUERY = '(prefers-reduced-motion: reduce)'
const PREFERENCES = ['system', 'reduced', 'full']

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

export function MotionPreferenceProvider({ children, initialPreference }) {
  const systemReduced = useSyncExternalStore(subscribe, getSystemReduced, () => false)
  const [preference, setPreferenceState] = useState(
    () => initialPreference ?? readStorage(STORAGE_KEY, (v) => PREFERENCES.includes(v), 'system'),
  )

  const reduced = preference === 'system' ? systemReduced : preference === 'reduced'

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
  }, [reduced])

  const setPreference = useCallback((next) => {
    if (!PREFERENCES.includes(next)) return
    setPreferenceState(next)
    writeStorage(STORAGE_KEY, next)
  }, [])

  const toggleReduced = useCallback(() => {
    setPreference(reduced ? 'full' : 'reduced')
  }, [reduced, setPreference])

  const value = useMemo(
    () => ({ reduced, preference, systemReduced, setPreference, toggleReduced }),
    [reduced, preference, systemReduced, setPreference, toggleReduced],
  )

  return (
    <MotionPreferenceContext.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </MotionPreferenceContext.Provider>
  )
}

export function useMotionPreference() {
  const context = useContext(MotionPreferenceContext)
  if (!context) throw new Error('useMotionPreference must be used inside <MotionPreferenceProvider>')
  return context
}

/** Shorthand: true when non-essential motion should be skipped. */
export function useReducedMotionPreference() {
  return useMotionPreference().reduced
}
