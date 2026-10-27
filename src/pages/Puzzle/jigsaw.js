/*
 * Jigsaw geometry (pure functions, unit-tested).
 *
 * A board of cols × rows square cells. Every inner edge gets a knob that
 * points one way; the two pieces sharing the edge get complementary sides
 * (+1 = tab sticking out, -1 = matching hole, 0 = flat border).
 */

/** Edge directions between neighbouring cells, chosen with `random`. */
export function createEdges(cols, rows, random = Math.random) {
  const pick = () => (random() < 0.5 ? 1 : -1)
  // horizontal[r][c]: edge between row r-1 and row r (r = 1..rows-1)
  const horizontal = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, () => (r === 0 ? 0 : pick())))
  // vertical[r][c]: edge between column c-1 and column c (c = 1..cols-1)
  const vertical = Array.from({ length: rows }, () => Array.from({ length: cols }, (_, c) => (c === 0 ? 0 : pick())))
  return { horizontal, vertical }
}

/** Sides of the piece at (row, col): top/right/bottom/left ∈ {-1, 0, 1}. */
export function pieceSides(edges, cols, rows, row, col) {
  const { horizontal, vertical } = edges
  return {
    top: row === 0 ? 0 : -horizontal[row][col],
    bottom: row === rows - 1 ? 0 : horizontal[row + 1][col],
    left: col === 0 ? 0 : -vertical[row][col],
    right: col === cols - 1 ? 0 : vertical[row][col + 1],
  }
}

// Classic knob, symmetric around the middle of the edge (x along the edge,
// y outwards, both relative): so an edge drawn backwards is the same shape.
const KNOB = [
  [[0.2, 0], [0.38, 0], [0.38, 0]],
  [[0.42, 0.06], [0.3, 0.1], [0.33, 0.18]],
  [[0.36, 0.27], [0.43, 0.29], [0.5, 0.29]],
  [[0.57, 0.29], [0.64, 0.27], [0.67, 0.18]],
  [[0.7, 0.1], [0.58, 0.06], [0.62, 0]],
  [[0.62, 0], [0.8, 0], [1, 0]],
]

export const KNOB_DEPTH = 0.29 // relative to the cell size

function edgePath(x0, y0, x1, y1, side, size) {
  if (side === 0) return `L${x1.toFixed(2)} ${y1.toFixed(2)}`
  const dx = x1 - x0
  const dy = y1 - y0
  // outward normal for a clockwise outline in screen coordinates
  const nx = (dy / Math.hypot(dx, dy)) * size * side
  const ny = (-dx / Math.hypot(dx, dy)) * size * side
  const point = ([u, v]) => `${(x0 + dx * u + nx * v).toFixed(2)} ${(y0 + dy * u + ny * v).toFixed(2)}`
  return KNOB.map(([c1, c2, end]) => `C${point(c1)} ${point(c2)} ${point(end)}`).join('')
}

/**
 * Outline of a piece whose cell occupies [pad, pad + size]² in its own SVG.
 */
export function piecePath(sides, size, pad) {
  const a = pad
  const b = pad + size
  return [
    `M${a} ${a}`,
    edgePath(a, a, b, a, sides.top, size),
    edgePath(b, a, b, b, sides.right, size),
    edgePath(b, b, a, b, sides.bottom, size),
    edgePath(a, b, a, a, sides.left, size),
    'Z',
  ].join('')
}

/** Is a dropped piece close enough to its home slot to snap in? */
export function isNearHome(position, home, size, tolerance = 0.3) {
  return Math.hypot(position.x - home.x, position.y - home.y) <= size * tolerance
}

/**
 * Layout for the play area: square cells, a 3:4 board, and free space for
 * the loose pieces (beside the board on wide screens, below it on phones).
 */
export function computeLayout(width, height, cols, rows) {
  const landscape = width / height > 1.05
  let size
  if (landscape) {
    size = Math.min((height * 0.88) / rows, (width * 0.4) / cols)
  } else {
    size = Math.min((height * 0.5) / rows, ((width - 24) * 0.66) / cols)
  }
  size = Math.max(40, Math.floor(size))
  const boardW = size * cols
  const boardH = size * rows
  const board = landscape
    ? { x: Math.round((width - boardW) / 2), y: Math.round((height - boardH) / 2), w: boardW, h: boardH }
    : { x: Math.round((width - boardW) / 2), y: 8, w: boardW, h: boardH }
  return { size, board, landscape, width, height }
}

/**
 * Scatter positions (top-left of each cell, in px) for `count` pieces in the
 * free space around the board. Uses a jittered grid, then random overlap if
 * the space is tight. `random` makes it deterministic in tests.
 */
export function scatterPositions(layout, count, random = Math.random) {
  const { size, board, width, height, landscape } = layout
  const knob = size * KNOB_DEPTH
  const minX = knob
  const maxX = width - size - knob
  const minY = knob
  const maxY = height - size - knob
  const zones = landscape
    ? [
        { x0: minX, x1: board.x - size - knob * 0.5, y0: minY, y1: maxY },
        { x0: board.x + board.w + knob * 0.5, x1: maxX, y0: minY, y1: maxY },
      ]
    : [{ x0: minX, x1: maxX, y0: board.y + board.h + knob * 1.2, y1: maxY }]
  const slots = []
  const step = size * 1.15
  zones.forEach((zone) => {
    if (zone.x1 < zone.x0 || zone.y1 < zone.y0) return
    for (let y = zone.y0; y <= zone.y1 + 0.01; y += step) {
      for (let x = zone.x0; x <= zone.x1 + 0.01; x += step) slots.push({ x, y })
    }
  })
  // shuffle slots
  for (let i = slots.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }
  const usable = zones.filter((zone) => zone.x1 >= zone.x0 && zone.y1 >= zone.y0)
  return Array.from({ length: count }, (_, index) => {
    const slot = slots[index]
    const jitter = () => (random() - 0.5) * size * 0.25
    if (slot) return { x: clamp(slot.x + jitter(), minX, maxX), y: clamp(slot.y + jitter(), minY, maxY) }
    const zone = usable[index % Math.max(1, usable.length)] ?? { x0: minX, x1: maxX, y0: minY, y1: maxY }
    return { x: clamp(zone.x0 + random() * (zone.x1 - zone.x0), minX, maxX), y: clamp(zone.y0 + random() * (zone.y1 - zone.y0), minY, maxY) }
  })
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}
