import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { AppProviders } from './context/AppProviders.jsx'
import { chapters } from './data/content.js'

function renderApp() {
  const user = userEvent.setup()
  const utils = render(
    <AppProviders initialMotionPreference="full">
      <App />
    </AppProviders>,
  )
  return { user, ...utils }
}

describe('App', () => {
  it('shows the opening gate first and keeps the page inert behind it', () => {
    const { container } = renderApp()
    expect(screen.getByRole('button', { name: /buka kejutan/i })).toBeInTheDocument()
    expect(container.querySelector('#main').parentElement).toHaveAttribute('inert')
  })

  it('opens the experience with music from one click, without asking for the microphone', async () => {
    const getUserMedia = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user, container } = renderApp()

    await user.click(screen.getByRole('button', { name: /buka kejutan/i }))

    expect(playSpy).toHaveBeenCalledTimes(1)
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(container.querySelector('#main').parentElement).not.toHaveAttribute('inert')
  })

  it('can open without music', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: /tanpa musik/i }))
    expect(playSpy).not.toHaveBeenCalled()
  })

  it('renders every chapter as a labelled section with a real id', async () => {
    const { user, container } = renderApp()
    await user.click(screen.getByRole('button', { name: /tanpa musik/i }))
    for (const chapter of chapters) {
      const section = container.querySelector(`#${chapter.id}`)
      expect(section, chapter.id).not.toBeNull()
      expect(section.querySelector('[data-chapter-heading]'), chapter.id).not.toBeNull()
    }
  })
})
