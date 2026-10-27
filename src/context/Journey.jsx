import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/*
 * `started` becomes true when the visitor taps the welcome card ("Mulai").
 * That tap is also the user gesture that may start the music, so the card
 * shows on every visit, on whichever page the visit begins.
 */

const JourneyContext = createContext(null)

export function JourneyProvider({ children, initialStarted = false }) {
  const [started, setStarted] = useState(initialStarted)
  const start = useCallback(() => setStarted(true), [])
  const value = useMemo(() => ({ started, start }), [started, start])
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
}

export function useJourney() {
  const context = useContext(JourneyContext)
  if (!context) throw new Error('useJourney must be used inside <JourneyProvider>')
  return context
}
