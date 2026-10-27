import { useEffect } from 'react'

/*
 * Locks page scrolling while `active` (opening gate, lightbox). Reference
 * counted so nested locks cannot unlock each other, and it compensates for
 * the scrollbar width to avoid a layout jump on desktop.
 */

let lockCount = 0
let savedPaddingRight = ''

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined
    const { body, documentElement } = document
    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth
      savedPaddingRight = body.style.paddingRight
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
      body.classList.add('is-scroll-locked')
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        body.classList.remove('is-scroll-locked')
        body.style.paddingRight = savedPaddingRight
      }
    }
  }, [active])
}
