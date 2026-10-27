import { describe, expect, it } from 'vitest'
import { createRng } from '../../lib/random.js'
import { countCorrect, createSolved, isPermutation, isSolved, isValidSaved, neighbourSlot, shuffleOrder, swap } from './puzzleLogic.js'

const DIFFICULTIES = [
  { id: 'mudah', cols: 3, rows: 4 },
  { id: 'seru', cols: 4, rows: 5 },
]

describe('puzzleLogic', () => {
  it('creates a solved board and detects it', () => {
    expect(createSolved(4)).toEqual([0, 1, 2, 3])
    expect(isSolved([0, 1, 2, 3])).toBe(true)
    expect(isSolved([1, 0, 2, 3])).toBe(false)
    expect(countCorrect([1, 0, 2, 3])).toBe(2)
  })

  it('swaps immutably', () => {
    const order = [0, 1, 2]
    expect(swap(order, 0, 2)).toEqual([2, 1, 0])
    expect(order).toEqual([0, 1, 2])
    expect(swap(order, 1, 1)).toBe(order)
  })

  it('always shuffles into a scrambled permutation', () => {
    const rng = createRng(7)
    for (let run = 0; run < 200; run += 1) {
      const order = shuffleOrder(12, rng)
      expect(isPermutation(order, 12)).toBe(true)
      expect(isSolved(order)).toBe(false)
      expect(countCorrect(order)).toBeLessThanOrEqual(1)
    }
  })

  it('falls back to a derangement if randomness misbehaves', () => {
    const order = shuffleOrder(5, () => 0.999999)
    expect(isSolved(order)).toBe(false)
    expect(isPermutation(order, 5)).toBe(true)
  })

  it('validates saved games strictly', () => {
    const order = shuffleOrder(12, createRng(1))
    expect(isValidSaved({ difficulty: 'mudah', order, moves: 3 }, DIFFICULTIES)).toBe(true)
    expect(isValidSaved({ difficulty: 'seru', order, moves: 3 }, DIFFICULTIES)).toBe(false) // wrong size
    expect(isValidSaved({ difficulty: 'mudah', order: createSolved(12), moves: 0 }, DIFFICULTIES)).toBe(false)
    expect(isValidSaved({ difficulty: 'mudah', order: [...order.slice(0, 11), 0], moves: 1 }, DIFFICULTIES)).toBe(false)
    expect(isValidSaved({ difficulty: 'mudah', order, moves: -1 }, DIFFICULTIES)).toBe(false)
    expect(isValidSaved({ difficulty: 'nope', order, moves: 1 }, DIFFICULTIES)).toBe(false)
    expect(isValidSaved(null, DIFFICULTIES)).toBe(false)
  })

  it('finds keyboard neighbours and stops at edges', () => {
    expect(neighbourSlot(0, 'ArrowLeft', 3, 4)).toBe(0)
    expect(neighbourSlot(0, 'ArrowRight', 3, 4)).toBe(1)
    expect(neighbourSlot(0, 'ArrowDown', 3, 4)).toBe(3)
    expect(neighbourSlot(11, 'ArrowDown', 3, 4)).toBe(11)
    expect(neighbourSlot(4, 'Home', 3, 4)).toBe(3)
    expect(neighbourSlot(4, 'End', 3, 4)).toBe(5)
  })
})
