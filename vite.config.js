import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// `base: './'` makes every built asset URL relative, so the same `dist/`
// works on Vercel (served from the domain root) and on GitHub Pages
// (served from /HappyBirthdayAya/). The app has no client-side routes,
// only in-page #anchors, so relative URLs are safe.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // three.js lives in its own lazily loaded chunk (the finale), which is
    // larger than Vite's default 500 kB warning threshold on purpose.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    // Process CSS (incl. modules, with hashed class names like production)
    // so tests see real styles such as pointer-events and [hidden].
    css: { include: [/.+/] },
    restoreMocks: true,
  },
})
