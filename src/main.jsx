import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/nunito/index.css'
import './styles/tokens.css'
import './styles/globals.css'

import App from './App.jsx'
import { AppProviders } from './context/AppProviders.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

// Each visit starts at the opening gate, then at the top (or the #chapter in
// the URL) — not wherever the previous session happened to be scrolled.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

// Development-only harness: /?harness=<name> renders one chapter in isolation
// (see src/dev/Harness.jsx). Vite removes this branch from production builds.
const Harness = import.meta.env.DEV ? lazy(() => import('./dev/Harness.jsx')) : null
const harnessName = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('harness') : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary variant="page">
      {Harness && harnessName ? (
        <Suspense fallback={null}>
          <Harness name={harnessName} />
        </Suspense>
      ) : (
        <AppProviders>
          <App />
        </AppProviders>
      )}
    </ErrorBoundary>
  </StrictMode>,
)
