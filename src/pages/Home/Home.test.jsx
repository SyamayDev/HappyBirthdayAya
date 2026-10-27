import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { letter, photos } from '../../data/content.js'
import { HomePage } from './HomePage.jsx'

const cover = () => document.querySelector('button[aria-controls]')

describe('HomePage', () => {
  it('shows the ten photos of the original ring, each opening full size', async () => {
    const { user } = renderWithProviders(<HomePage />, { motion: 'reduced' })
    const ring = screen.getByRole('region', { name: 'Foto-foto Aya' })
    const cards = within(ring).getAllByRole('button')
    expect(cards).toHaveLength(photos.length)
    await user.click(cards[2])
    const viewer = screen.getByRole('dialog', { name: 'Foto 3 dari 10' })
    expect(within(viewer).getByRole('img', { name: photos[2].alt })).toHaveAttribute('src', photos[2].src)
    await user.click(within(viewer).getByRole('button', { name: 'Foto berikutnya' }))
    expect(screen.getByRole('dialog', { name: 'Foto 4 dari 10' })).toBeInTheDocument()
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cards[2]).toHaveFocus()
  })

  it('opens the book to the original letter, word for word', async () => {
    const { user } = renderWithProviders(<HomePage />, { motion: 'reduced' })
    expect(cover()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', { name: letter.title })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: letter.openLabel }))
    expect(cover()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('heading', { name: letter.title })).toHaveFocus()
    expect(screen.getByText(letter.greeting)).toBeInTheDocument()
    letter.paragraphs.forEach((paragraph) => expect(screen.getByText(paragraph)).toBeInTheDocument())
    expect(screen.getByText(letter.signOff)).toBeInTheDocument()
  })

  it('"Buka!" goes to the puzzle page and does not close the book', async () => {
    window.history.replaceState(null, '', '#/')
    const { user } = renderWithProviders(<HomePage />, { motion: 'reduced' })
    await user.click(screen.getByRole('button', { name: letter.openLabel }))
    await user.click(screen.getByRole('button', { name: new RegExp(letter.cta) }))
    expect(window.location.hash).toBe('#/puzzle')
    expect(cover()).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes the book and returns focus to the cover', async () => {
    const { user } = renderWithProviders(<HomePage />, { motion: 'reduced' })
    await user.click(screen.getByRole('button', { name: letter.openLabel }))
    await user.click(screen.getByRole('button', { name: letter.closeLabel }))
    expect(cover()).toHaveAttribute('aria-expanded', 'false')
    expect(cover()).toHaveFocus()
  })
})
