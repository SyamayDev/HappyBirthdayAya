import { useSyncExternalStore } from 'react'
import { routes } from '../data/content.js'

/*
 * The original site was four separate HTML pages. Here each page has its
 * own hash URL (#/, #/puzzle, #/kue, #/galaksi), so refresh, links and the
 * browser Back button behave like real pages on any static host.
 */

export function routeFromHash(hash) {
  const id = String(hash ?? '')
    .replace(/^#\/?/, '')
    .split(/[?#/]/)[0]
  return routes.includes(id) ? id : 'beranda'
}

export function hashFor(route) {
  return route === 'beranda' ? '#/' : `#/${route}`
}

function subscribe(onChange) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute() {
  return useSyncExternalStore(subscribe, () => routeFromHash(window.location.hash), () => 'beranda')
}

/** Changes page (adds a history entry, so Back returns to the previous page). */
export function setRoute(route) {
  const hash = hashFor(route)
  if (window.location.hash !== hash) window.location.hash = hash
}
