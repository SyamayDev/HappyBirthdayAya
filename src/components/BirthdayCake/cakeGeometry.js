/* Cake geometry shared by the SVG art and the HTML candle layer (SVG units, viewBox 400 × 380). */

export const TOP = { cx: 200, cy: 128, rx: 82, ry: 18, bottom: 206 }
export const BASE = { cx: 200, cy: 212, rx: 142, ry: 26, bottom: 324 }

/** Top surface of the cake in percent of the art box (where candles stand). */
export const SURFACE = {
  left: ((TOP.cx - TOP.rx) / 400) * 100,
  top: ((TOP.cy - TOP.ry) / 380) * 100,
  width: ((TOP.rx * 2) / 400) * 100,
  height: ((TOP.ry * 2) / 380) * 100,
}
