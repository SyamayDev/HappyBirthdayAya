import { screen, waitFor, within } from '@testing-library/react'
import confetti from 'canvas-confetti'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { puzzle } from '../../data/content.js'
import { STORAGE_KEYS } from '../../context/Journey.jsx'
import { PhotoPuzzle } from './PhotoPuzzle.jsx'

const pieces = () => within(screen.getByRole('group', { name: /papan puzzle/i })).getAllByRole('button')
const pieceNumbers = () => pieces().map((piece) => Number(piece.getAttribute('aria-label').match(/Potongan (\d+)/)[1]))
const journey = () => JSON.parse(localStorage.getItem(`aya:${STORAGE_KEYS.journey}`))

async function start(user) {
  await user.click(screen.getByRole('button', { name: puzzle.intro.start }))
}

describe('PhotoPuzzle', () => {
  it('shows the original intro copy and starts a 12-piece game', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    expect(screen.getByText(puzzle.intro.heading)).toBeInTheDocument()
    expect(screen.getByText(puzzle.intro.message)).toBeInTheDocument()
    expect(screen.getByText(puzzle.intro.quote)).toBeInTheDocument()
    await start(user)
    expect(pieces()).toHaveLength(12)
    expect(pieceNumbers().every((number, slot) => number === slot + 1)).toBe(false)
  })

  it('offers the harder 20-piece level', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    await user.click(screen.getByRole('radio', { name: /seru/i }))
    await start(user)
    expect(pieces()).toHaveLength(20)
  })

  it('selects and swaps two pieces by tapping', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    await start(user)
    const before = pieceNumbers()
    await user.click(pieces()[0])
    expect(pieces()[0]).toHaveAttribute('aria-pressed', 'true')
    await user.click(pieces()[1])
    expect(pieceNumbers().slice(0, 2)).toEqual([before[1], before[0]])
    expect(screen.getByText(/1 langkah/)).toBeInTheDocument()
  })

  it('tapping the selected piece again cancels the selection', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    await start(user)
    await user.click(pieces()[2])
    await user.click(pieces()[2])
    expect(pieces()[2]).toHaveAttribute('aria-pressed', 'false')
  })

  it('swaps with the keyboard (arrows + Enter)', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    await start(user)
    const before = pieceNumbers()
    pieces()[0].focus()
    await user.keyboard('{Enter}{ArrowRight}{Enter}')
    expect(pieceNumbers().slice(0, 2)).toEqual([before[1], before[0]])
    expect(pieces()[1]).toHaveFocus()
  })

  it('peeks at the photo', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    await start(user)
    const peek = screen.getByRole('button', { name: /intip foto/i })
    await user.click(peek)
    expect(peek).toHaveAttribute('aria-pressed', 'true')
  })

  it('"Bantu susun" completes it with the original success message, once', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    await start(user)
    await user.click(screen.getByRole('button', { name: /bantu susun/i }))
    expect(screen.getByRole('heading', { name: puzzle.success.title })).toHaveFocus()
    expect(screen.getByText(puzzle.success.description)).toBeInTheDocument()
    expect(screen.getByText(puzzle.success.envelopeNote)).toBeInTheDocument()
    expect(screen.getByText(puzzle.success.badge)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: puzzle.image.alt })).toBeInTheDocument()
    expect(journey().puzzleSolved).toBe(true)
    expect(confetti).not.toHaveBeenCalled() // reduced motion: no confetti
    expect(localStorage.getItem(`aya:${STORAGE_KEYS.puzzle}`)).toBeNull()
  })

  it('with full motion, assembles the photo, then celebrates once', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'full' })
    await start(user)
    await user.click(screen.getByRole('button', { name: /bantu susun/i }))
    expect(confetti).toHaveBeenCalled()
    const calls = confetti.mock.calls.length
    await waitFor(() => expect(screen.getByRole('heading', { name: puzzle.success.title })).toBeInTheDocument(), { timeout: 4000 })
    expect(confetti.mock.calls.length).toBe(calls)
  })

  it('"Main lagi" returns to the intro', async () => {
    const { user } = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced', progress: { puzzleSolved: true } })
    expect(screen.getByRole('heading', { name: puzzle.success.title })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /main lagi/i }))
    expect(screen.getByRole('heading', { name: puzzle.intro.heading })).toHaveFocus()
  })

  it('restores an in-progress game after a refresh and ignores corrupt saves', async () => {
    const saved = { difficulty: 'mudah', order: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10], moves: 4 }
    localStorage.setItem(`aya:${STORAGE_KEYS.puzzle}`, JSON.stringify(saved))
    const first = renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    expect(pieceNumbers()).toEqual(saved.order.map((piece) => piece + 1))
    expect(screen.getByText(/4 langkah/)).toBeInTheDocument()
    first.unmount()

    localStorage.setItem(`aya:${STORAGE_KEYS.puzzle}`, JSON.stringify({ difficulty: 'mudah', order: [0, 0, 0], moves: 1 }))
    renderWithProviders(<PhotoPuzzle />, { motion: 'reduced' })
    expect(screen.getByRole('button', { name: puzzle.intro.start })).toBeInTheDocument()
  })
})
