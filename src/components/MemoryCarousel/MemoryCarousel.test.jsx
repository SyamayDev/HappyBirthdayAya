import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { photos } from '../../data/content.js'
import { AUTOPLAY_MS, MemoryCarousel } from './MemoryCarousel.jsx'

const counter = () => screen.getByText(/dari 10/, { selector: 'p:not([aria-live])' }).textContent
const activeSlide = () => document.querySelector('[aria-roledescription="slide"]:not([aria-hidden])')

// Simulate the carousel scrolling into view (jsdom never fires IntersectionObserver).
function bringIntoView() {
  act(() => {
    for (const observer of window.IntersectionObserver.instances) {
      observer.callback(
        [...document.querySelectorAll('[aria-roledescription="carousel"]')].map((target) => ({ target, isIntersecting: true, intersectionRatio: 1 })),
        observer,
      )
    }
  })
}

describe('MemoryCarousel', () => {
  it('moves forward and backward and wraps at both ends', async () => {
    const { user } = renderWithProviders(<MemoryCarousel />)
    expect(counter()).toBe('Foto 1 dari 10')
    await user.click(screen.getByRole('button', { name: 'Foto sebelumnya' }))
    expect(counter()).toBe('Foto 10 dari 10')
    await user.click(screen.getByRole('button', { name: 'Foto berikutnya' }))
    expect(counter()).toBe('Foto 1 dari 10')
    expect(activeSlide()).toHaveAttribute('aria-label', '1 dari 10')
  })

  it('jumps with the photo rail and marks the current photo', async () => {
    const { user } = renderWithProviders(<MemoryCarousel />)
    await user.click(screen.getByRole('button', { name: 'Tampilkan foto 7' }))
    expect(counter()).toBe('Foto 7 dari 10')
    expect(screen.getByRole('button', { name: 'Tampilkan foto 7' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Tampilkan foto 1' })).not.toHaveAttribute('aria-current')
  })

  it('supports arrow keys inside the carousel', async () => {
    const { user } = renderWithProviders(<MemoryCarousel />)
    await user.click(screen.getByRole('button', { name: 'Foto berikutnya' }))
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(counter()).toBe('Foto 4 dari 10')
    await user.keyboard('{ArrowLeft}')
    expect(counter()).toBe('Foto 3 dari 10')
  })

  it('autoplays only while visible, and the pause toggle stops it', () => {
    vi.useFakeTimers()
    try {
      renderWithProviders(<MemoryCarousel />)
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS * 2))
      expect(counter()).toBe('Foto 1 dari 10') // not on screen yet
      bringIntoView()
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS))
      expect(counter()).toBe('Foto 2 dari 10')
      fireEvent.click(screen.getByRole('button', { name: /jeda putar otomatis/i }))
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS * 3))
      expect(counter()).toBe('Foto 2 dari 10')
      expect(screen.getByRole('button', { name: /^putar otomatis/i })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('has no autoplay at all under reduced motion', () => {
    vi.useFakeTimers()
    try {
      renderWithProviders(<MemoryCarousel />, { motion: 'reduced' })
      bringIntoView()
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS * 3))
      expect(counter()).toBe('Foto 1 dari 10')
      expect(screen.queryByRole('button', { name: /putar otomatis/i })).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens the active photo full size and closes it, restoring focus', async () => {
    const { user } = renderWithProviders(<MemoryCarousel />)
    const card = within(activeSlide()).getByRole('button')
    await user.click(card)
    const dialog = screen.getByRole('dialog', { name: 'Foto 1 dari 10' })
    expect(within(dialog).getByRole('img', { name: photos[0].alt })).toHaveAttribute('src', photos[0].src)
    expect(document.body).toHaveClass('is-scroll-locked')

    await user.click(within(dialog).getByRole('button', { name: 'Foto berikutnya' }))
    expect(screen.getByRole('dialog', { name: 'Foto 2 dari 10' })).toBeInTheDocument()

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tutup' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(counter()).toBe('Foto 2 dari 10') // the ring follows the last viewed photo
    expect(within(activeSlide()).getByRole('button')).toHaveFocus()
    expect(document.body).not.toHaveClass('is-scroll-locked')
  })

  it('closes the viewer with Escape (dialog cancel)', async () => {
    const { user } = renderWithProviders(<MemoryCarousel />)
    await user.click(within(activeSlide()).getByRole('button'))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a graceful placeholder when a photo fails to load', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderWithProviders(<MemoryCarousel />)
    const image = activeSlide().querySelector('img')
    fireEvent.error(image)
    expect(within(activeSlide()).getByText('Foto tidak tersedia')).toBeInTheDocument()
  })
})
