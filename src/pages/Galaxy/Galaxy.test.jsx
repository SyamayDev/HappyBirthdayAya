import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { finale } from '../../data/content.js'
import { GalaxyPage } from './GalaxyPage.jsx'
import { matchesSecret, normalizePhrase } from './secret.js'

describe('secret phrase', () => {
  it('follows the original rule: any phrase containing "sayang"', () => {
    expect(matchesSecret('ayil sayang aya', 'sayang')).toBe(true)
    expect(matchesSecret('  SAYANG!! ', 'sayang')).toBe(true)
    expect(matchesSecret('sayng', 'sayang')).toBe(false)
    expect(matchesSecret('', 'sayang')).toBe(false)
    expect(normalizePhrase('Ayil   Sayang-Aya')).toBe('ayil sayang aya')
  })
})

describe('GalaxyPage', () => {
  it('without WebGL shows the static sky with every message as real text', async () => {
    window.history.replaceState(null, '', '#/galaksi')
    const { user } = renderWithProviders(<GalaxyPage />, { motion: 'full' })
    expect(screen.getByText(finale.planetGreeting)).toBeInTheDocument()
    expect(screen.getByText(finale.couple)).toBeInTheDocument()
    finale.rings.forEach((text) => expect(screen.getByText(text)).toBeInTheDocument())
    expect(document.querySelector('canvas')).toBeNull()
    await user.click(screen.getByRole('button', { name: /kembali ke awal/i }))
    // the heart wipe covers the screen first, then the page changes
    await waitFor(() => expect(window.location.hash).toBe('#/'), { timeout: 3000 })
  })
})
