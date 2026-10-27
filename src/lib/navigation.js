/*
 * In-page chapter navigation. Uses real #hash URLs so the browser Back
 * button walks back through chapters, and moves keyboard/screen-reader
 * focus to the chapter heading after scrolling.
 */

/**
 * @param {string} id chapter id (section element id)
 * @param {{ reduced?: boolean, focus?: boolean }} [options]
 * @returns {boolean} whether the chapter exists
 */
export function goToChapter(id, { reduced = false, focus = true } = {}) {
  const section = document.getElementById(id)
  if (!section) {
    if (import.meta.env.DEV) console.warn(`[navigation] no chapter with id "${id}"`)
    return false
  }

  const behavior = reduced ? 'auto' : 'smooth'
  if (window.location.hash !== `#${id}`) {
    window.history.pushState(null, '', `#${id}`)
  }
  section.scrollIntoView({ behavior, block: 'start' })

  if (focus) {
    const heading = section.querySelector('[data-chapter-heading]') ?? section
    heading.focus({ preventScroll: true })
  }
  return true
}

/** Chapter id from the current URL hash, if it names an existing section. */
export function chapterFromHash(validIds) {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  return validIds.includes(id) ? id : null
}
