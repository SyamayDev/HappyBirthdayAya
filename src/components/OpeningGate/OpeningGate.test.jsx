import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { gate, hero } from '../../data/content.js'
import { OpeningGate } from './OpeningGate.jsx'
import { Hero } from '../Hero/Hero.jsx'
import { SkyBackdrop } from '../SkyBackdrop/SkyBackdrop.jsx'
import { SparkleTrail } from '../SparkleTrail/SparkleTrail.jsx'

describe('OpeningGate', () => {
  it('is a labelled modal dialog with both entry options', () => {
    renderWithProviders(<OpeningGate />, { started: false })
    const dialog = screen.getByRole('dialog', { name: gate.to })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: gate.openWithMusic })).toHaveFocus()
    expect(screen.getByRole('button', { name: gate.openWithoutMusic })).toBeInTheDocument()
    expect(document.body).toHaveClass('is-scroll-locked')
  })

  it('starts the music exactly once, even on a double click, then leaves', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user } = renderWithProviders(<OpeningGate />, { started: false, motion: 'reduced' })
    const button = screen.getByRole('button', { name: gate.openWithMusic })
    await user.dblClick(button)
    expect(playSpy).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.body).not.toHaveClass('is-scroll-locked')
  })

  it('opens without music when asked', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user } = renderWithProviders(<OpeningGate />, { started: false, motion: 'reduced' })
    await user.click(screen.getByRole('button', { name: gate.openWithoutMusic }))
    expect(playSpy).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('renders nothing once the journey has started', () => {
    renderWithProviders(<OpeningGate />, { started: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Hero', () => {
  it('names the chapter heading and scrolls to the memories', async () => {
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { user, container } = renderWithProviders(
      <>
        <Hero />
        <section id="kenangan">
          <h2 data-chapter-heading tabIndex={-1}>Kenangan</h2>
        </section>
      </>,
    )
    expect(screen.getByRole('heading', { level: 1, name: `${hero.titleLine}, ${hero.name}` })).toBeInTheDocument()
    expect(screen.getByText(hero.greetingVerbatim)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: new RegExp(hero.cta) }))
    expect(scrollSpy).toHaveBeenCalled()
    expect(window.location.hash).toBe('#kenangan')
    expect(container.querySelector('#kenangan h2')).toHaveFocus()
  })
})

describe('decorative layers', () => {
  it('keeps the sky hidden from assistive technology', () => {
    const { container } = renderWithProviders(<SkyBackdrop />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not render the sparkle trail without a fine pointer', () => {
    const { container } = renderWithProviders(<SparkleTrail />)
    // Only the providers' own <audio> and live region remain.
    expect(container.querySelectorAll('span[class*="item"]')).toHaveLength(0)
  })
})
