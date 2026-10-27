import { screen, waitFor, within } from '@testing-library/react'
import confetti from 'canvas-confetti'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { cake } from '../../data/content.js'
import { addCandle, fillCandles, litCount } from './candles.js'
import { CakePage } from './CakePage.jsx'

afterEach(() => {
  delete navigator.mediaDevices
})

const counter = () => screen.getByText(cake.counterLabel, { exact: false }).textContent

async function begin(user) {
  await user.click(screen.getByRole('button', { name: cake.instructions.start }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('candles', () => {
  it('fills up to the maximum and nudges overlapping taps', () => {
    let id = 0
    const all = fillCandles([], 18, () => `c${(id += 1)}`)
    expect(all).toHaveLength(18)
    expect(litCount(all)).toBe(18)
    const two = addCandle(addCandle([], 18, { u: 0, v: 0 }, 'a'), 18, { u: 0, v: 0 }, 'b')
    expect(two).toHaveLength(2)
    expect(Math.hypot(two[1].u - two[0].u, two[1].v - two[0].v)).toBeGreaterThan(0.1)
  })
})

describe('CakePage', () => {
  it('shows the original "Hai Cayaang!" instructions', () => {
    renderWithProviders(<CakePage />, { motion: 'reduced' })
    const card = screen.getByRole('dialog', { name: cake.instructions.heading })
    cake.instructions.steps.forEach((step) => expect(within(card).getByText(step)).toBeInTheDocument())
    expect(within(card).getByText(cake.instructions.secretStep.phrase)).toBeInTheDocument()
  })

  it('places candles, blows them out, and accepts the secret phrase', async () => {
    const { user } = renderWithProviders(<CakePage />, { motion: 'full' })
    await begin(user)
    expect(counter()).toContain(`${cake.counterLabel} 0`)
    await user.click(screen.getByRole('button', { name: 'Tiup' }))
    expect(screen.getByText(/taruh lilinnya dulu/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Taruh lilin di kue' }))
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    expect(counter()).toContain(`${cake.counterLabel} 2`)
    await user.click(screen.getByRole('button', { name: 'Tiup lilin 1' }))
    expect(screen.queryByRole('button', { name: 'Tiup lilin 1' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tiup' }))

    expect(await screen.findByText(cake.guidance.secret)).toBeInTheDocument()
    expect(confetti).toHaveBeenCalled()
    const input = screen.getByLabelText('Kata rahasia')
    await user.type(input, 'halo{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent(/belum tepat/i)
    await user.clear(input)
    await user.type(input, 'Ayil Sayang Aya{Enter}')
    await waitFor(() => expect(window.location.hash).toBe('#/galaksi'))
  })

  it('caps the cake at 18 candles', async () => {
    const { user } = renderWithProviders(<CakePage />, { motion: 'reduced' })
    await begin(user)
    for (let i = 0; i < 18; i += 1) await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    expect(counter()).toContain(`${cake.counterLabel} 18`)
    expect(screen.getByRole('button', { name: 'Tambah lilin' })).toBeDisabled()
  })

  it('asks for the microphone only after "Siap, Mulai" and copes with a refusal', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(Object.assign(new Error('no'), { name: 'NotAllowedError' }))
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    const { user } = renderWithProviders(<CakePage />, { motion: 'reduced' })
    expect(getUserMedia).not.toHaveBeenCalled()
    await begin(user)
    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/mikrofon tidak aktif/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    await user.click(screen.getByRole('button', { name: 'Tiup' }))
    expect(await screen.findByText(cake.guidance.secret)).toBeInTheDocument()
  })

  it('keeps the original help button that skips to the final surprise', async () => {
    const { user } = renderWithProviders(<CakePage />, { motion: 'reduced' })
    await begin(user)
    await user.click(screen.getByRole('button', { name: cake.help.title }))
    const help = screen.getByRole('dialog', { name: cake.help.title })
    expect(within(help).getByText(cake.help.text)).toBeInTheDocument()
    await user.click(within(help).getByRole('button', { name: cake.help.cta }))
    expect(window.location.hash).toBe('#/galaksi')
  })
})
