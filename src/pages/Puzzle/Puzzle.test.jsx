import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { puzzle } from '../../data/content.js'
import { createRng } from '../../lib/random.js'
import { computeLayout, createEdges, isNearHome, piecePath, pieceSides, scatterPositions } from './jigsaw.js'
import { PuzzlePage } from './PuzzlePage.jsx'

describe('jigsaw geometry', () => {
  it('gives neighbouring pieces complementary edges and flat borders', () => {
    const edges = createEdges(3, 4, createRng(3))
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const sides = pieceSides(edges, 3, 4, row, col)
        if (row === 0) expect(sides.top).toBe(0)
        if (col === 0) expect(sides.left).toBe(0)
        if (row === 3) expect(sides.bottom).toBe(0)
        if (col === 2) expect(sides.right).toBe(0)
        if (col < 2) expect(sides.right).toBe(-pieceSides(edges, 3, 4, row, col + 1).left)
        if (row < 3) expect(sides.bottom).toBe(-pieceSides(edges, 3, 4, row + 1, col).top)
      }
    }
  })

  it('draws knobs only on inner edges', () => {
    const flat = piecePath({ top: 0, right: 0, bottom: 0, left: 0 }, 100, 30)
    const knobbed = piecePath({ top: 0, right: 1, bottom: -1, left: 0 }, 100, 30)
    expect(flat.match(/C/g)).toBeNull()
    expect(knobbed.match(/C/g)).toHaveLength(12)
  })

  it('snaps only near the right slot', () => {
    expect(isNearHome({ x: 105, y: 98 }, { x: 100, y: 100 }, 80)).toBe(true)
    expect(isNearHome({ x: 160, y: 100 }, { x: 100, y: 100 }, 80)).toBe(false)
  })

  it('lays out the board beside the pieces on wide screens and above them on phones', () => {
    const wide = computeLayout(1400, 800, 3, 4)
    expect(wide.landscape).toBe(true)
    const phone = computeLayout(390, 700, 3, 4)
    expect(phone.landscape).toBe(false)
    for (const layout of [wide, phone]) {
      const spots = scatterPositions(layout, 12, createRng(9))
      spots.forEach((spot) => {
        expect(spot.x).toBeGreaterThanOrEqual(0)
        expect(spot.y).toBeGreaterThanOrEqual(0)
        expect(spot.x).toBeLessThanOrEqual(layout.width - layout.size)
        expect(spot.y).toBeLessThanOrEqual(layout.height - layout.size)
      })
    }
    // phone: loose pieces start below the board
    scatterPositions(phone, 12, createRng(2)).forEach((spot) => expect(spot.y).toBeGreaterThan(phone.board.y + phone.board.h))
  })
})

describe('PuzzlePage', () => {
  beforeEach(() => {
    // jsdom has no layout: give the play area a size.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(760)
  })

  const pieces = () => screen.getAllByRole('button', { name: /^Keping \d+/ })

  it('shows the original intro card first', () => {
    renderWithProviders(<PuzzlePage />, { motion: 'reduced' })
    const intro = screen.getByRole('dialog', { name: puzzle.intro.heading })
    expect(within(intro).getByText(puzzle.intro.message)).toBeInTheDocument()
    expect(within(intro).getByText(`“${puzzle.intro.quote}”`)).toBeInTheDocument()
    expect(pieces()).toHaveLength(12)
  })

  it('places pieces with the keyboard and finishes with the original message', async () => {
    const { user } = renderWithProviders(<PuzzlePage />, { motion: 'reduced' })
    await user.click(screen.getByRole('button', { name: puzzle.intro.start }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    pieces()[0].focus()
    await user.keyboard('{Enter}')
    expect(pieces()[0]).toHaveAccessibleName(/sudah terpasang/)
    for (let i = 0; i < 11; i += 1) await user.click(screen.getByRole('button', { name: 'Bantu pasang satu keping' }))
    const done = await screen.findByRole('dialog', { name: puzzle.success.title })
    expect(within(done).getByText(puzzle.success.badge)).toBeInTheDocument()
    expect(within(done).getByText(puzzle.success.description)).toBeInTheDocument()
    await user.click(within(done).getByRole('button', { name: new RegExp(puzzle.success.cta) }))
    expect(window.location.hash).toBe('#/kue')
  })

  it('toggles the photo peek', async () => {
    const { user } = renderWithProviders(<PuzzlePage />, { motion: 'reduced' })
    await user.click(screen.getByRole('button', { name: puzzle.intro.start }))
    const peek = await screen.findByRole('button', { name: 'Intip foto' })
    await user.click(peek)
    expect(peek).toHaveAttribute('aria-pressed', 'true')
  })
})
