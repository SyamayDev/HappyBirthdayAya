import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/amatic-sc/700.css'
import '@fontsource/indie-flower/400.css'
import '@fontsource-variable/nunito/index.css'
import './styles/tokens.css'
import './styles/globals.css'

import App from './App.jsx'
import { AppProviders } from './context/AppProviders.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary variant="page">
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
