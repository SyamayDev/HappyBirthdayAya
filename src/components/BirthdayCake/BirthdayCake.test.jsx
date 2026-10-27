import { act, screen, waitFor } from '@testing-library/react'
import confetti from 'canvas-confetti'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { cake } from '../../data/content.js'
import { STORAGE_KEYS } from '../../context/Journey.jsx'
import { AUTO_SLOTS, addCandle, fillCandles, litCount } from './candles.js'
import { BirthdayCake } from './BirthdayCake.jsx'

const counterText = () => screen.getByText(cake.counterLabel, { exact: false }).textContent
const journey = () => JSON.parse(localStorage.getItem(`aya:${STORAGE_KEYS.journey}`))

async function begin(user) {
  await user.click(screen.getByRole('button', { name: cake.instructions.start }))
}

afterEach(() => {
  delete navigator.mediaDevices
})

describe('candles', () => {
  it('fills exactly up to the maximum without overlaps', () => {
    let id = 0
    const all = fillCandles([], 18, () => `c${(id += 1)}`)
    expect(all).toHaveLength(18)
    expect(addCandle(all, 18, { u: 0, v: 0 }, 'extra')).toBe(all)
    expect(AUTO_SLOTS).toHaveLength(18)
    expect(litCount(all)).toBe(18)
  })

  it('nudges a tap that lands on an existing candle', () => {
    const one = addCandle([], 18, { u: 0, v: 0 }, 'a')
    const two = addCandle(one, 18, { u: 0, v: 0 }, 'b')
    expect(two).toHaveLength(2)
    expect(Math.hypot(two[1].u - two[0].u, two[1].v - two[0].v)).toBeGreaterThan(0.1)
  })
})

describe('BirthdayCake', () => {
  it('shows the original instructions first', () => {
    renderWithProviders(<BirthdayCake />, { motion: 'reduced' })
    expect(screen.getByRole('heading', { name: cake.instructions.heading })).toBeInTheDocument()
    cake.instructions.steps.forEach((step) => expect(screen.getAllByText(step).length).toBeGreaterThan(0))
  })

  it('places candles by button, by tapping the cake top, and caps at 18', async () => {
    const { user } = renderWithProviders(<BirthdayCake />, { motion: 'reduced' })
    await begin(user)
    expect(counterText()).toContain(`${cake.counterLabel} 0`)
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    await user.click(screen.getByRole('button', { name: 'Taruh lilin di sini' }))
    expect(counterText()).toContain(`${cake.counterLabel} 2`)
    await user.click(screen.getByRole('button', { name: 'Pasang 18 lilin' }))
    expect(counterText()).toContain(`${cake.counterLabel} 18`)
    expect(screen.getByRole('button', { name: 'Tambah lilin' })).toBeDisabled()
  })

  it('asks for candles before blowing', async () => {
    const { user } = renderWithProviders(<BirthdayCake />, { motion: 'reduced' })
    await begin(user)
    await user.click(screen.getByRole('button', { name: 'Tiup lilinnya' }))
    expect(screen.getByText(/taruh lilinnya dulu/i)).toHaveAttribute('role', 'status')
  })

  it('blows single flames and celebrates exactly once when all are out', async () => {
    const { user } = renderWithProviders(<BirthdayCake />, { motion: 'full' })
    await begin(user)
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    await user.click(screen.getByRole('button', { name: 'Tiup lilin 1' }))
    expect(screen.queryByRole('button', { name: 'Tiup lilin 1' })).not.toBeInTheDocument()
    expect(confetti).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Tiup lilin 2' }))
    expect(screen.getByText(cake.guidance.secret)).toBeInTheDocument()
    expect(journey().candlesOut).toBe(true)
    expect(confetti).toHaveBeenCalled()
    expect(confetti.mock.calls.length).toBe(3) // one celebration = three bursts
    const calls = confetti.mock.calls.length
    await user.click(screen.getByRole('button', { name: /nyalakan lagi/i }))
    expect(screen.getByRole('button', { name: 'Tiup lilin 1' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tiup lilinnya' }))
    expect(confetti.mock.calls.length).toBeGreaterThan(calls) // a relight is a new celebration
  })

  it('remembers a finished cake', () => {
    renderWithProviders(<BirthdayCake />, { motion: 'reduced', progress: { candlesOut: true } })
    expect(screen.getByRole('button', { name: /nyalakan lagi/i })).toBeInTheDocument()
    expect(counterText()).toContain(`${cake.counterLabel} 18`)
  })

  it('never asks for the microphone unless the optional button is pressed', async () => {
    const getUserMedia = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    const { user } = renderWithProviders(<BirthdayCake />, { motion: 'reduced' })
    await begin(user)
    await user.click(screen.getByRole('button', { name: 'Pasang 18 lilin' }))
    await user.click(screen.getByRole('button', { name: 'Tiup lilin 3' }))
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /mikrofon \(opsional\)/i })).toBeInTheDocument()
  })

  it('handles a denied microphone gracefully', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' }))
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    const { user } = renderWithProviders(<BirthdayCake />, { motion: 'reduced' })
    await begin(user)
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    await user.click(screen.getByRole('button', { name: /mikrofon \(opsional\)/i }))
    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/izin mikrofon tidak diberikan/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tiup lilinnya' }))
    expect(screen.getByText(cake.guidance.secret)).toBeInTheDocument()
  })

  it('stops every microphone track when the cake unmounts', async () => {
    const stop = vi.fn()
    const stream = { getTracks: () => [{ stop }] }
    const close = vi.fn(() => Promise.resolve())
    class FakeAudioContext {
      state = 'running'
      createAnalyser() {
        return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 256, getByteFrequencyData() {} }
      }
      createMediaStreamSource() {
        return { connect() {} }
      }
      close = close
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    const { user, unmount } = renderWithProviders(<BirthdayCake />, { motion: 'reduced' })
    await begin(user)
    await user.click(screen.getByRole('button', { name: 'Tambah lilin' }))
    await user.click(screen.getByRole('button', { name: /mikrofon \(opsional\)/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /matikan mikrofon/i })).toBeInTheDocument())
    act(() => unmount())
    expect(stop).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
