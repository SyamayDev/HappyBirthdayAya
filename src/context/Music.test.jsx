import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MusicProvider, useMusic } from './Music.jsx'

function Probe() {
  const { status, toggle, play, pause } = useMusic()
  return (
    <div>
      <p data-testid="status">{status}</p>
      <button type="button" onClick={toggle}>toggle</button>
      <button type="button" onClick={play}>play</button>
      <button type="button" onClick={pause}>pause</button>
    </div>
  )
}

function setup() {
  const user = userEvent.setup()
  render(
    <MusicProvider>
      <Probe />
    </MusicProvider>,
  )
  return { user, status: () => screen.getByTestId('status').textContent, audio: screen.getByTestId('background-music') }
}

function setHidden(hidden) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('MusicProvider', () => {
  it('starts idle and never plays without a user action', () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { status } = setup()
    expect(status()).toBe('idle')
    expect(playSpy).not.toHaveBeenCalled()
  })

  it('plays and pauses from user actions', async () => {
    const { user, status } = setup()
    await user.click(screen.getByText('toggle'))
    expect(status()).toBe('playing')
    await user.click(screen.getByText('toggle'))
    expect(status()).toBe('paused')
  })

  it('reports "blocked" instead of throwing when the browser refuses playback', async () => {
    const blocked = Object.assign(new Error('blocked'), { name: 'NotAllowedError' })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(blocked)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { user, status } = setup()
    await user.click(screen.getByText('play'))
    expect(status()).toBe('blocked')
  })

  it('reports "unavailable" when the file cannot be loaded, and can retry', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { user, status, audio } = setup()
    act(() => {
      audio.dispatchEvent(new Event('error'))
    })
    expect(status()).toBe('unavailable')
    await user.click(screen.getByText('play'))
    expect(status()).toBe('playing')
  })

  it('pauses for a hidden tab and resumes only if the listener still wants music', async () => {
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause')
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user, audio } = setup()
    await user.click(screen.getByText('play'))
    expect(playSpy).toHaveBeenCalledTimes(1)

    Object.defineProperty(audio, 'paused', { configurable: true, get: () => false })
    act(() => setHidden(true))
    expect(pauseSpy).toHaveBeenCalled()
    await act(async () => setHidden(false))
    expect(playSpy).toHaveBeenCalledTimes(2)

    // An intentional pause must not be overridden by the tab becoming visible.
    await user.click(screen.getByText('pause'))
    act(() => setHidden(true))
    await act(async () => setHidden(false))
    expect(playSpy).toHaveBeenCalledTimes(2)
    delete document.hidden
  })
})
