/*
 * Guarded localStorage access. Storage can be unavailable (private mode,
 * disabled cookies, quota) — every call degrades to the fallback instead
 * of throwing, and every read is validated before it is trusted.
 */

const PREFIX = 'aya:'

function warn(message, error) {
  if (import.meta.env.DEV) console.warn(`[storage] ${message}`, error)
}

/**
 * @template T
 * @param {string} key
 * @param {(value: unknown) => boolean} isValid
 * @param {T} fallback
 * @returns {T}
 */
export function readStorage(key, isValid, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const value = JSON.parse(raw)
    if (isValid(value)) return value
    warn(`ignoring invalid value for "${key}"`, value)
    return fallback
  } catch (error) {
    warn(`cannot read "${key}"`, error)
    return fallback
  }
}

/** @returns {boolean} whether the value was stored */
export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (error) {
    warn(`cannot write "${key}"`, error)
    return false
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch (error) {
    warn(`cannot remove "${key}"`, error)
  }
}
