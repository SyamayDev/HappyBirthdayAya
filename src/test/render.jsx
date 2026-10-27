import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProviders } from '../context/AppProviders.jsx'

const EMPTY_PROGRESS = { puzzleSolved: false, candlesOut: false, finaleUnlocked: false }

/**
 * Renders `ui` inside every app provider.
 * @param {import('react').ReactElement} ui
 * @param {{ started?: boolean, progress?: object, motion?: 'system'|'reduced'|'full' }} [options]
 */
export function renderWithProviders(ui, { started = true, progress, motion = 'full', ...options } = {}) {
  const user = userEvent.setup()
  const result = render(
    <AppProviders
      initialStarted={started}
      initialProgress={{ ...EMPTY_PROGRESS, ...progress }}
      initialMotionPreference={motion}
    >
      {ui}
    </AppProviders>,
    options,
  )
  return { user, ...result }
}
