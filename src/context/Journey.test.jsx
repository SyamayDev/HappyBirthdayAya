import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JourneyProvider, STORAGE_KEYS, useJourney } from './Journey.jsx'

function Probe() {
  const { progress, complete, resetJourney, resetCount } = useJourney()
  return (
    <div>
      <p data-testid="progress">{JSON.stringify(progress)}</p>
      <p data-testid="reset">{resetCount}</p>
      <button type="button" onClick={() => complete('puzzleSolved')}>solve</button>
      <button type="button" onClick={() => complete('nonsense')}>bogus</button>
      <button type="button" onClick={resetJourney}>reset</button>
    </div>
  )
}

const read = () => JSON.parse(screen.getByTestId('progress').textContent)

describe('JourneyProvider', () => {
  it('persists milestones and ignores unknown ones', async () => {
    const user = userEvent.setup()
    render(
      <JourneyProvider>
        <Probe />
      </JourneyProvider>,
    )
    await user.click(screen.getByText('bogus'))
    expect(read().puzzleSolved).toBe(false)
    await user.click(screen.getByText('solve'))
    expect(read().puzzleSolved).toBe(true)
    expect(JSON.parse(localStorage.getItem(`aya:${STORAGE_KEYS.journey}`)).puzzleSolved).toBe(true)
  })

  it('falls back to a clean state when stored data is corrupt', () => {
    localStorage.setItem(`aya:${STORAGE_KEYS.journey}`, '{"puzzleSolved":"yes"')
    render(
      <JourneyProvider>
        <Probe />
      </JourneyProvider>,
    )
    expect(read()).toEqual({ puzzleSolved: false, candlesOut: false, finaleUnlocked: false })
  })

  it('reset clears progress and per-chapter storage', async () => {
    const user = userEvent.setup()
    localStorage.setItem(`aya:${STORAGE_KEYS.puzzle}`, '{"order":[1,0]}')
    render(
      <JourneyProvider initialProgress={{ puzzleSolved: true, candlesOut: true, finaleUnlocked: true }}>
        <Probe />
      </JourneyProvider>,
    )
    await user.click(screen.getByText('reset'))
    expect(read().finaleUnlocked).toBe(false)
    expect(screen.getByTestId('reset').textContent).toBe('1')
    expect(localStorage.getItem(`aya:${STORAGE_KEYS.puzzle}`)).toBeNull()
  })
})
