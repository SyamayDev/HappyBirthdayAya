import { existsSync } from 'node:fs'
import { defineConfig } from '@playwright/test'

/*
 * Browser smoke tests against the production build (`vite build` + `vite preview`).
 * Uses the locally installed Google Chrome when one is found (no download
 * needed); otherwise Playwright's own Chromium — install it once with
 * `npx playwright install chromium`. Override with PW_CHANNEL=chrome|msedge.
 */
const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
]
const channel = process.env.PW_CHANNEL || (CHROME_PATHS.some((path) => existsSync(path)) ? 'chrome' : undefined)
const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    channel,
    locale: 'id-ID',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
