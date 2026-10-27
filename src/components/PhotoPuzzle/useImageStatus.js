import { useEffect, useState } from 'react'

/*
 * Preloads an image and reports 'loading' | 'ready' | 'error'.
 * `retry()` tries again after a failure. Status is tracked per (src, attempt)
 * so changing either starts a fresh 'loading' state without an effect-time
 * setState.
 */
export function useImageStatus(src) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: null, status: 'loading' })
  const key = `${src}#${attempt}`

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled) setResult({ key, status: 'ready' })
    }
    image.onerror = () => {
      if (cancelled) return
      if (import.meta.env.DEV) console.warn(`[PhotoPuzzle] image failed to load: ${src}`)
      setResult({ key, status: 'error' })
    }
    image.src = src
    if (image.complete && image.naturalWidth > 0) {
      // Cached image: onload may already have fired synchronously in some browsers.
      queueMicrotask(() => {
        if (!cancelled) setResult({ key, status: 'ready' })
      })
    }
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [src, key])

  return {
    status: result.key === key ? result.status : 'loading',
    retry: () => setAttempt((value) => value + 1),
  }
}
