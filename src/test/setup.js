/*
 * Vitest setup: jest-dom matchers + small stand-ins for browser APIs that
 * jsdom does not implement. Plain functions are used (not vi.fn) so
 * `restoreMocks` never strips them between tests; tests can still
 * vi.spyOn(...) any of them.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// canvas-confetti draws on a <canvas>; jsdom has no 2D context.
vi.mock('canvas-confetti', () => {
  const confetti = vi.fn(() => Promise.resolve())
  confetti.reset = vi.fn()
  confetti.shapeFromPath = vi.fn(() => ({ type: 'path' }))
  confetti.create = vi.fn(() => confetti)
  return { default: confetti }
})

// matchMedia — reduced motion can be simulated with window.__prefersReducedMotion = true
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? window.__prefersReducedMotion === true : false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })
}

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.root = null
    this.rootMargin = options?.rootMargin ?? ''
    this.thresholds = [].concat(options?.threshold ?? 0)
    MockIntersectionObserver.instances.add(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {
    MockIntersectionObserver.instances.delete(this)
  }
  takeRecords() {
    return []
  }
}
MockIntersectionObserver.instances = new Set()
if (!window.IntersectionObserver) window.IntersectionObserver = MockIntersectionObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!window.ResizeObserver) window.ResizeObserver = MockResizeObserver

if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function scrollIntoView() {}
if (!window.scrollTo || window.scrollTo.toString().includes('not implemented')) window.scrollTo = () => {}

// <dialog>: minimal showModal/close. Native Escape handling does not exist in
// jsdom — tests fire a 'cancel' event on the dialog instead.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.show = function show() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(returnValue) {
    if (!this.hasAttribute('open')) return
    if (returnValue !== undefined) this.returnValue = returnValue
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// Media elements: jsdom throws "not implemented" for play/pause/load.
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: function play() {
    return Promise.resolve()
  },
})
Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, writable: true, value: function pause() {} })
Object.defineProperty(HTMLMediaElement.prototype, 'load', { configurable: true, writable: true, value: function load() {} })

// No canvas backend in jsdom: report "unsupported" quietly (WebGL → fallback paths).
HTMLCanvasElement.prototype.getContext = function getContext() {
  return null
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.__prefersReducedMotion = false
  document.documentElement.removeAttribute('data-motion')
  document.body.className = ''
  document.body.removeAttribute('style')
  window.history.replaceState(null, '', '/')
})
