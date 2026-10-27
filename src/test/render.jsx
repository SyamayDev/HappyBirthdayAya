import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProviders } from '../context/AppProviders.jsx'

/**
 * Renders `ui` inside every app provider.
 * @param {import('react').ReactElement} ui
 * @param {{ started?: boolean, motion?: 'system'|'reduced'|'full' }} [options]
 */
export function renderWithProviders(ui, { started = true, motion = 'full', ...options } = {}) {
  const user = userEvent.setup()
  const result = render(
    <AppProviders initialStarted={started} initialMotionPreference={motion}>
      {ui}
    </AppProviders>,
    options,
  )
  return { user, ...result }
}
