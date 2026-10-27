import { useSyncExternalStore } from 'react'

/* true while the browser tab is visible — used to pause loops and timers. */

function subscribe(onChange) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

function getSnapshot() {
  return !document.hidden
}

export function usePageVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
