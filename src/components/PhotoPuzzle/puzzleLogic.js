/*
 * Pure swap-puzzle logic. A board is an array `order` where order[slot] is
 * the id of the piece sitting in that slot; piece `i` belongs in slot `i`.
 */

export function createSolved(count) {
  return Array.from({ length: count }, (_, index) => index)
}

export function isSolved(order) {
  return order.every((piece, slot) => piece === slot)
}

export function countCorrect(order) {
  return order.reduce((total, piece, slot) => total + (piece === slot ? 1 : 0), 0)
}

export function swap(order, a, b) {
  if (a === b) return order
  const next = order.slice()
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

/**
 * Shuffles until the board is clearly scrambled: never solved and at most
 * `maxInPlace` pieces already correct.
 * @param {number} count
 * @param {() => number} random returns [0, 1)
 */
export function shuffleOrder(count, random = Math.random, maxInPlace = Math.max(1, Math.floor(count / 8))) {
  if (count < 2) return createSolved(count)
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const order = createSolved(count)
    for (let i = count - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    if (!isSolved(order) && countCorrect(order) <= maxInPlace) return order
  }
  // Fallback: a guaranteed derangement (rotate by one).
  return createSolved(count).map((_, slot) => (slot + 1) % count)
}

export function isPermutation(order, count) {
  if (!Array.isArray(order) || order.length !== count) return false
  const seen = new Set(order)
  return seen.size === count && order.every((piece) => Number.isInteger(piece) && piece >= 0 && piece < count)
}

/** Validates a saved game against the configured difficulties. */
export function isValidSaved(value, difficulties) {
  if (!value || typeof value !== 'object') return false
  const difficulty = difficulties.find((item) => item.id === value.difficulty)
  if (!difficulty) return false
  const count = difficulty.cols * difficulty.rows
  return isPermutation(value.order, count) && !isSolved(value.order) && Number.isInteger(value.moves) && value.moves >= 0
}

/** Slot index of the neighbour in a direction, or the same slot at an edge. */
export function neighbourSlot(slot, key, cols, rows) {
  const row = Math.floor(slot / cols)
  const col = slot % cols
  switch (key) {
    case 'ArrowUp':
      return row > 0 ? slot - cols : slot
    case 'ArrowDown':
      return row < rows - 1 ? slot + cols : slot
    case 'ArrowLeft':
      return col > 0 ? slot - 1 : slot
    case 'ArrowRight':
      return col < cols - 1 ? slot + 1 : slot
    case 'Home':
      return row * cols
    case 'End':
      return row * cols + cols - 1
    default:
      return slot
  }
}
