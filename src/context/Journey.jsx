import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readStorage, removeStorage, writeStorage } from '../lib/storage.js'

/*
 * Journey state shared across chapters:
 *   started   – the opening gate was opened (not persisted: the gate is the
 *               user gesture that may start music, so it shows on every visit)
 *   progress  – milestones, persisted so a refresh does not lose them
 *   resetCount – bumps on "replay"; App uses it as a key to remount chapters
 */

export const STORAGE_KEYS = {
  journey: 'journey.v1',
  puzzle: 'puzzle.v1',
  cake: 'cake.v1',
}

export const MILESTONES = ['puzzleSolved', 'candlesOut', 'finaleUnlocked']

const EMPTY_PROGRESS = Object.freeze({ puzzleSolved: false, candlesOut: false, finaleUnlocked: false })

function isValidProgress(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    MILESTONES.every((key) => typeof value[key] === 'boolean')
  )
}

const JourneyContext = createContext(null)

export function JourneyProvider({ children, initialStarted = false, initialProgress }) {
  const [started, setStarted] = useState(initialStarted)
  const [progress, setProgress] = useState(
    () => initialProgress ?? readStorage(STORAGE_KEYS.journey, isValidProgress, EMPTY_PROGRESS),
  )
  const [resetCount, setResetCount] = useState(0)

  useEffect(() => {
    writeStorage(STORAGE_KEYS.journey, progress)
  }, [progress])

  const start = useCallback(() => setStarted(true), [])

  const complete = useCallback((milestone) => {
    if (!MILESTONES.includes(milestone)) return
    setProgress((current) => (current[milestone] ? current : { ...current, [milestone]: true }))
  }, [])

  const resetJourney = useCallback(() => {
    removeStorage(STORAGE_KEYS.puzzle)
    removeStorage(STORAGE_KEYS.cake)
    setProgress(EMPTY_PROGRESS)
    setResetCount((count) => count + 1)
  }, [])

  const value = useMemo(
    () => ({ started, start, progress, complete, resetJourney, resetCount }),
    [started, start, progress, complete, resetJourney, resetCount],
  )

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
}

export function useJourney() {
  const context = useContext(JourneyContext)
  if (!context) throw new Error('useJourney must be used inside <JourneyProvider>')
  return context
}
