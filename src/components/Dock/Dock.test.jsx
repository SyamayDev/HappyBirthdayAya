import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render.jsx'
import { chapters } from '../../data/content.js'
import { Dock } from './Dock.jsx'

function renderDock(options) {
  return renderWithProviders(
    <>
      {chapters.map((chapter) => (
        <section key={chapter.id} id={chapter.id}>
          <h2 data-chapter-heading tabIndex={-1}>
            {chapter.label}
          </h2>
        </section>
      ))}
      <Dock />
    </>,
    options,
  )
}

describe('Dock', () => {
  it('opens a chapter menu with real links, and closes with Escape', async () => {
    const { user } = renderDock()
    const toggle = screen.getByRole('button', { name: /daftar bab/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(chapters.map((chapter) => `#${chapter.id}`))
    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('navigates to a chapter and closes the menu', async () => {
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { user } = renderDock()
    await user.click(screen.getByRole('button', { name: /daftar bab/i }))
    await user.click(screen.getByRole('link', { name: /surat/i }))
    expect(scrollSpy).toHaveBeenCalled()
    expect(window.location.hash).toBe('#surat')
    await waitFor(() => expect(screen.queryByRole('link', { name: /surat/i })).not.toBeInTheDocument())
  })

  it('closes the menu on an outside click', async () => {
    const { user } = renderDock()
    await user.click(screen.getByRole('button', { name: /daftar bab/i }))
    await user.click(document.body)
    await waitFor(() => expect(screen.queryAllByRole('link')).toHaveLength(0))
  })

  it('shows milestone states', async () => {
    const { user } = renderDock({ progress: { puzzleSolved: true } })
    await user.click(screen.getByRole('button', { name: /daftar bab/i }))
    expect(within(screen.getByRole('link', { name: /puzzle/i })).getByText('(selesai)')).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /bintang/i })).getByText('(terkunci)')).toBeInTheDocument()
  })

  it('reflects the real music state', async () => {
    const { user } = renderDock()
    await user.click(screen.getByRole('button', { name: 'Putar musik' }))
    expect(screen.getByRole('button', { name: 'Jeda musik' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Jeda musik' }))
    expect(screen.getByRole('button', { name: 'Putar musik' })).toBeInTheDocument()
  })

  it('handles blocked playback and a missing audio file without throwing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValueOnce(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
    const { user } = renderDock()
    await user.click(screen.getByRole('button', { name: 'Putar musik' }))
    expect(screen.getByRole('button', { name: 'Putar musik' })).toBeInTheDocument()
    expect(screen.getByText('Ketuk untuk memutar')).toBeInTheDocument()

    act(() => {
      screen.getByTestId('background-music').dispatchEvent(new Event('error'))
    })
    expect(screen.getByRole('button', { name: /musik tidak tersedia/i })).toBeInTheDocument()
  })

  it('toggles reduced motion for the whole page', async () => {
    const { user } = renderDock()
    const toggle = screen.getByRole('button', { name: 'Animasi hemat' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.dataset.motion).toBe('full')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })
})
