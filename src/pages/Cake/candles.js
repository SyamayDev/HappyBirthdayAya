/*
 * Candle placement on the cake's top surface. Positions are normalised
 * ellipse coordinates: u (left → right) and v (back → front) in [-1, 1].
 */

export const MIN_GAP = 0.22 // minimum normalised distance between candles
const EDGE = 0.86 // keep candles inside the frosting rim

/** Pre-computed pleasant slots: an outer ring of 12 and an inner ring of 6. */
export const AUTO_SLOTS = (() => {
  const slots = []
  const ring = (count, radius, offset) => {
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * Math.PI * 2
      slots.push({ u: Math.cos(angle) * radius, v: Math.sin(angle) * radius })
    }
  }
  ring(12, 0.8, Math.PI / 2)
  ring(6, 0.38, Math.PI / 2 + Math.PI / 6)
  // Fill front-centre first, then alternate outwards: looks good at any count.
  return slots.sort((a, b) => b.v - a.v + Math.abs(a.u) * 0.35 - Math.abs(b.u) * 0.35)
})()

function distance(a, b) {
  return Math.hypot(a.u - b.u, (a.v - b.v) * 0.7)
}

export function clampToSurface({ u, v }) {
  const r = Math.hypot(u, v)
  if (r <= EDGE || r === 0) return { u, v }
  return { u: (u / r) * EDGE, v: (v / r) * EDGE }
}

function isFree(candles, point) {
  return candles.every((candle) => distance(candle, point) >= MIN_GAP)
}

export function nextAutoSlot(candles) {
  return AUTO_SLOTS.find((slot) => isFree(candles, slot)) ?? null
}

/**
 * Adds a candle near the requested point (or the next auto slot).
 * Returns the same array when the cake is full or no room is left.
 */
export function addCandle(candles, max, point, id) {
  if (candles.length >= max) return candles
  const usable = point && Number.isFinite(point.u) && Number.isFinite(point.v)
  let position = usable ? clampToSurface(point) : null
  if (position && !isFree(candles, position)) {
    // Nudge to the nearest free spot around the tap.
    position = null
    for (let step = 1; step <= 6 && !position; step += 1) {
      for (let k = 0; k < 8; k += 1) {
        const angle = (k / 8) * Math.PI * 2
        const candidate = clampToSurface({ u: point.u + Math.cos(angle) * MIN_GAP * step * 0.6, v: point.v + Math.sin(angle) * MIN_GAP * step * 0.6 })
        if (isFree(candles, candidate)) {
          position = candidate
          break
        }
      }
    }
  }
  position = position ?? nextAutoSlot(candles)
  if (!position) return candles
  return [...candles, { id, u: position.u, v: position.v, lit: true }]
}

export function fillCandles(candles, max, makeId) {
  let next = candles
  while (next.length < max) {
    const before = next
    next = addCandle(next, max, null, makeId())
    if (next === before) break
  }
  return next
}

export const litCount = (candles) => candles.filter((candle) => candle.lit).length
