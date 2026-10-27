import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { music as musicConfig } from '../data/content.js'

/*
 * Background music, started only by a user gesture (no autoplay, no
 * microphone permission). The UI state mirrors real media events.
 *
 * status:
 *   idle        – never started
 *   loading     – play() requested or buffering
 *   playing     – audio is audible
 *   paused      – paused by the listener (or while the tab is hidden)
 *   blocked     – the browser refused playback (autoplay policy); tap again
 *   unavailable – the file could not be loaded/decoded; the app works without it
 *
 * When the tab is hidden the song pauses and resumes on return — but only
 * if the listener still wants music (an intentional pause is respected).
 */

const MusicContext = createContext(null)

const NETWORK_NO_SOURCE = 3

export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const wantsMusicRef = useRef(false)
  const pausedForHiddenTabRef = useRef(false)
  const [status, setStatus] = useState('idle')

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false
    wantsMusicRef.current = true
    pausedForHiddenTabRef.current = false
    if (audio.error || audio.networkState === NETWORK_NO_SOURCE) audio.load()
    audio.volume = musicConfig.volume
    setStatus((current) => (current === 'playing' ? current : 'loading'))
    try {
      await audio.play()
      if (wantsMusicRef.current) setStatus('playing')
      return true
    } catch (error) {
      // pause() during a pending play() rejects with AbortError: not a failure.
      if (error?.name === 'AbortError') return false
      wantsMusicRef.current = false
      setStatus(error?.name === 'NotAllowedError' ? 'blocked' : 'unavailable')
      if (import.meta.env.DEV) console.warn('[music] playback failed:', error)
      return false
    }
  }, [])

  const pause = useCallback(() => {
    wantsMusicRef.current = false
    pausedForHiddenTabRef.current = false
    const audio = audioRef.current
    if (audio && !audio.paused) audio.pause()
    setStatus((current) => (current === 'unavailable' ? current : 'paused'))
  }, [])

  const toggle = useCallback(() => {
    if (status === 'playing' || status === 'loading') pause()
    else play()
  }, [status, play, pause])

  // Pause while the tab is hidden; resume afterwards only if still wanted.
  useEffect(() => {
    function onVisibilityChange() {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        if (!audio.paused) {
          pausedForHiddenTabRef.current = true
          audio.pause()
        }
      } else if (pausedForHiddenTabRef.current) {
        pausedForHiddenTabRef.current = false
        if (wantsMusicRef.current) play()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [play])

  // Stop the song if the provider unmounts.
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (audio && !audio.paused) audio.pause()
    }
  }, [])

  const handlePlaying = useCallback(() => {
    if (wantsMusicRef.current) setStatus('playing')
  }, [])
  const handlePause = useCallback(() => {
    setStatus((current) => (current === 'unavailable' || current === 'blocked' ? current : 'paused'))
  }, [])
  const handleWaiting = useCallback(() => {
    if (wantsMusicRef.current) setStatus('loading')
  }, [])
  const handleError = useCallback(() => {
    wantsMusicRef.current = false
    setStatus('unavailable')
    if (import.meta.env.DEV) console.warn('[music] could not load the audio file')
  }, [])

  const value = useMemo(
    () => ({
      status,
      isPlaying: status === 'playing',
      isLoading: status === 'loading',
      isUnavailable: status === 'unavailable',
      label: musicConfig.label,
      play,
      pause,
      toggle,
    }),
    [status, play, pause, toggle],
  )

  const lastIndex = musicConfig.sources.length - 1

  return (
    <MusicContext.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- decorative background song, no spoken content; it has its own visible play/pause control */}
      <audio
        ref={audioRef}
        loop
        preload="none"
        onPlaying={handlePlaying}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onError={handleError}
        onEnded={handlePause}
        data-testid="background-music"
      >
        {musicConfig.sources.map((source, index) => (
          <source
            key={source.type}
            src={source.src}
            type={source.type}
            // Errors on <source> do not bubble to <audio>; the last one failing
            // means no source could be used.
            onError={index === lastIndex ? handleError : undefined}
          />
        ))}
      </audio>
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) throw new Error('useMusic must be used inside <MusicProvider>')
  return context
}
