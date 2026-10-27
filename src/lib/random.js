/*
 * Seeded pseudo-random numbers (mulberry32). Decorative layouts (stars,
 * clouds, sparkles) use a fixed seed so rendering stays pure and stable
 * across re-renders and tests.
 */

export function createRng(seed = 1) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function range(rng, min, max) {
  return min + rng() * (max - min)
}

