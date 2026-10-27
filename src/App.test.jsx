import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { AppProviders } from './context/AppProviders.jsx'
import { pageTitles, welcome } from './data/content.js'
import { routeFromHash } from './lib/router.js'

function renderApp({ hash = '#/' } = {}) {
  window.history.replaceState(null, '', hash)
  const user = userEvent.setup()
  const utils = render(
    <AppProviders initialMotionPreference="reduced">
      <App />
    </AppProviders>,
  )
  return { user, ...utils }
}

describe('router', () => {
  it('maps hashes to the four original pages, defaulting to home', () => {
    expect(routeFromHash('')).toBe('beranda')
    expect(routeFromHash('#/')).toBe('beranda')
    expect(routeFromHash('#/puzzle')).toBe('puzzle')
    expect(routeFromHash('#/kue')).toBe('kue')
    expect(routeFromHash('#/galaksi')).toBe('galaksi')
    expect(routeFromHash('#/nope')).toBe('beranda')
  })
})

describe('App', () => {
  it('greets with the welcome card and never asks for the microphone', async () => {
    const getUserMedia = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user } = renderApp()
    expect(screen.getByRole('dialog', { name: welcome.title })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: welcome.start }))
    expect(playSpy).toHaveBeenCalledTimes(1)
    expect(getUserMedia).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: welcome.title })).not.toBeInTheDocument())
    delete navigator.mediaDevices
  })

  it('can start without music', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: welcome.startWithoutMusic }))
    expect(playSpy).not.toHaveBeenCalled()
  })

  it.each([
    ['#/', 'beranda'],
    ['#/puzzle', 'puzzle'],
    ['#/kue', 'kue'],
    ['#/galaksi', 'galaksi'],
  ])('opens %s directly (refresh-safe) with the right title', async (hash, route) => {
    renderApp({ hash })
    expect(await screen.findByRole('heading', { level: 1, name: pageTitles[route], hidden: true })).toBeInTheDocument()
    expect(document.title).toBe(pageTitles[route])
  })

  it('follows the browser Back/Forward buttons (hash changes)', async () => {
    renderApp({ hash: '#/' })
    act(() => {
      window.history.pushState(null, '', '#/kue')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(await screen.findByRole('heading', { level: 1, name: pageTitles.kue, hidden: true })).toBeInTheDocument()
  })
})
