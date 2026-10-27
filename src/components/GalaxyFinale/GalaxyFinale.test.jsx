import { screen } from '@testing-library/react'
import confetti from 'canvas-confetti'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { finale, people } from '../../data/content.js'
import { STORAGE_KEYS } from '../../context/Journey.jsx'
import { GalaxyFinale } from './GalaxyFinale.jsx'
import { matchesSecret, normalizePhrase } from './secret.js'

const journey = () => JSON.parse(localStorage.getItem(`aya:${STORAGE_KEYS.journey}`))

function renderFinale(options) {
  return renderWithProviders(
    <>
      {['pembuka', 'kenangan', 'kue'].map((id) => (
        <section key={id} id={id}>
          <h2 data-chapter-heading tabIndex={-1}>
            {id}
          </h2>
        </section>
      ))}
      <GalaxyFinale />
    </>,
    options,
  )
}

describe('secret phrase', () => {
  it('follows the original rule: any phrase containing "sayang"', () => {
    expect(matchesSecret('ayil sayang aya', 'sayang')).toBe(true)
    expect(matchesSecret('  SAYANG!! ', 'sayang')).toBe(true)
    expect(matchesSecret('aku sayang kamu', 'sayang')).toBe(true)
    expect(matchesSecret('sayng', 'sayang')).toBe(false)
    expect(matchesSecret('', 'sayang')).toBe(false)
    expect(normalizePhrase('Ayil   Sayang-Aya')).toBe('ayil sayang aya')
  })
})

describe('GalaxyFinale', () => {
  it('starts locked behind the secret door', () => {
    renderFinale()
    expect(screen.getByText(finale.secret.prompt)).toBeInTheDocument()
    expect(screen.getByLabelText('Kata rahasia')).toBeInTheDocument()
    expect(screen.queryByText(finale.planetGreeting)).not.toBeInTheDocument()
  })

  it('rejects a wrong phrase politely and keeps focus in the field', async () => {
    const { user } = renderFinale()
    const input = screen.getByLabelText('Kata rahasia')
    await user.type(input, 'halo')
    await user.click(screen.getByRole('button', { name: 'Buka' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/belum tepat/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveFocus()
    expect(journey().finaleUnlocked).toBe(false)
  })

  it('shows the hint on request', async () => {
    const { user } = renderFinale()
    await user.click(screen.getByRole('button', { name: /lihat petunjuk/i }))
    expect(screen.getByText(new RegExp(finale.secret.hint))).toBeVisible()
  })

  it('unlocks with the phrase and shows every message as real text (static sky without WebGL)', async () => {
    const { user } = renderFinale()
    await user.type(screen.getByLabelText('Kata rahasia'), 'Ayil Sayang Aya{Enter}')
    expect(journey().finaleUnlocked).toBe(true)
    expect(confetti).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: finale.planetGreeting })).toHaveFocus()
    expect(screen.getByText(finale.couple)).toBeInTheDocument()
    finale.rings.forEach((text) => expect(screen.getByText(text)).toBeInTheDocument())
    expect(screen.getByText(new RegExp(`oleh ${people.sender} untuk ${people.recipient}`))).toBeInTheDocument()
  })

  it('can be opened without the phrase', async () => {
    const { user } = renderFinale()
    await user.click(screen.getByRole('button', { name: /tanpa kata rahasia/i }))
    expect(screen.getByRole('heading', { name: finale.planetGreeting })).toBeInTheDocument()
  })

  it('offers next actions, and replay resets the journey', async () => {
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { user } = renderFinale({ progress: { puzzleSolved: true, candlesOut: true, finaleUnlocked: true } })
    await user.click(screen.getByRole('button', { name: /lihat kenangan lagi/i }))
    expect(window.location.hash).toBe('#kenangan')
    await user.click(screen.getByRole('button', { name: /nyalakan lilin lagi/i }))
    expect(window.location.hash).toBe('#kue')
    expect(scrollSpy).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /putar ulang dari awal/i }))
    expect(journey()).toEqual({ puzzleSolved: false, candlesOut: false, finaleUnlocked: false })
    expect(await screen.findByLabelText('Kata rahasia')).toBeInTheDocument()
  })
})
