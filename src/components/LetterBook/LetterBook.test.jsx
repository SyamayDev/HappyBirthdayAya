import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { letter } from '../../data/content.js'
import { LetterBook } from './LetterBook.jsx'

function renderBook() {
  return renderWithProviders(
    <>
      <LetterBook />
      <section id="hadiah">
        <h2 data-chapter-heading tabIndex={-1}>Puzzle</h2>
      </section>
    </>,
  )
}

// The cover leaves the accessibility tree once the book is open (the letter takes over).
const cover = () => document.querySelector('button[aria-controls]')

describe('LetterBook', () => {
  it('starts closed with the letter hidden from assistive technology', () => {
    renderBook()
    expect(screen.getByRole('button', { name: letter.openLabel })).toBe(cover())
    expect(cover()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', { name: letter.title })).not.toBeInTheDocument()
  })

  it('opens from the cover and shows the original letter verbatim', async () => {
    const { user } = renderBook()
    await user.click(cover())
    expect(cover()).toHaveAttribute('aria-expanded', 'true')
    const title = screen.getByRole('heading', { name: letter.title })
    expect(title).toHaveFocus()
    expect(screen.getByText(letter.greeting)).toBeInTheDocument()
    letter.paragraphs.forEach((paragraph) => expect(screen.getByText(paragraph)).toBeInTheDocument())
    expect(screen.getByText(letter.signOff)).toBeInTheDocument()
  })

  it('opens with the keyboard', async () => {
    const { user } = renderBook()
    cover().focus()
    await user.keyboard('{Enter}')
    expect(cover()).toHaveAttribute('aria-expanded', 'true')
  })

  it('"Buka!" goes to the puzzle without closing the book (no click bubbling)', async () => {
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { user } = renderBook()
    await user.click(cover())
    await user.click(screen.getByRole('button', { name: letter.cta }))
    expect(scrollSpy).toHaveBeenCalled()
    expect(window.location.hash).toBe('#hadiah')
    expect(cover()).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes again and returns focus to the cover', async () => {
    const { user } = renderBook()
    await user.click(cover())
    await user.click(screen.getByRole('button', { name: letter.closeLabel }))
    expect(cover()).toHaveAttribute('aria-expanded', 'false')
    expect(cover()).toHaveFocus()
  })
})
