import { createContext, useCallback, useContext, useState } from 'react'

/*
 * One polite live region for important asynchronous feedback
 * ("Puzzle selesai!", "Semua lilin padam", music errors). Decorative
 * animations are never announced.
 */

const AnnouncerContext = createContext(null)

export function AnnouncerProvider({ children }) {
  const [message, setMessage] = useState({ id: 0, text: '' })

  const announce = useCallback((text) => {
    setMessage((current) => ({ id: current.id + 1, text }))
  }, [])

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {message.text ? <span key={message.id}>{message.text}</span> : null}
      </div>
    </AnnouncerContext.Provider>
  )
}

const noop = () => {}

/** Returns `announce(text)`. Safe to call outside the provider (no-op). */
export function useAnnounce() {
  return useContext(AnnouncerContext) ?? noop
}
