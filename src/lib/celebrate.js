/*
 * One tasteful confetti moment for meaningful achievements (puzzle solved,
 * candles blown out, final surprise unlocked). Never loops, never blocks UI,
 * and does nothing when reduced motion is active.
 */
import confetti from 'canvas-confetti'

const COLORS = ['#8fc4fb', '#64a9ef', '#3a7fd5', '#c5cbff', '#a5adf6', '#ffffff', '#fff1b8']
const HEART_PATH =
  'M12 21s-6.7-4.35-9.33-8.1C.6 9.93 2.04 5.5 6.1 5.03c2.06-.24 3.67.86 4.62 2.3.95-1.44 2.56-2.54 4.62-2.3 4.06.47 5.5 4.9 3.43 7.87C18.7 16.65 12 21 12 21z'

let heartShape = null

function getShapes() {
  if (heartShape === null) {
    try {
      heartShape = confetti.shapeFromPath({ path: HEART_PATH })
    } catch {
      heartShape = false // Path2D unsupported: fall back to built-in shapes
    }
  }
  return heartShape ? ['circle', 'star', heartShape] : ['circle', 'star']
}

/**
 * @param {{ reduced?: boolean, origin?: { x?: number, y?: number }, intensity?: 'normal' | 'grand' }} [options]
 */
export function celebrate({ reduced = false, origin, intensity = 'normal' } = {}) {
  if (reduced || typeof window === 'undefined') return
  try {
    const shapes = getShapes()
    const base = {
      colors: COLORS,
      shapes,
      zIndex: 140,
      disableForReducedMotion: true,
      ticks: 240,
      gravity: 0.9,
      scalar: 1.05,
    }
    const grand = intensity === 'grand'
    confetti({ ...base, particleCount: grand ? 140 : 90, spread: grand ? 95 : 75, startVelocity: grand ? 48 : 40, origin: { x: 0.5, y: 0.62, ...origin } })
    confetti({ ...base, particleCount: grand ? 70 : 40, angle: 60, spread: 58, startVelocity: 46, origin: { x: 0, y: 0.78 } })
    confetti({ ...base, particleCount: grand ? 70 : 40, angle: 120, spread: 58, startVelocity: 46, origin: { x: 1, y: 0.78 } })
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[celebrate] confetti failed', error)
  }
}
