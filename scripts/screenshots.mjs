#!/usr/bin/env node
/*
 * Screenshots of every page and its key moments + a quick browser QA pass.
 *
 *   npm run dev               # in another terminal
 *   npm run shots             # → docs/screenshots (390 px phone + 1440 px desktop)
 *   npm run shots -- --widths=320,768 --out=test-results/shots --reduced
 *
 * It reports console errors, failed requests, broken images and horizontal
 * overflow, and exits non-zero if any are found. Uses the installed Google
 * Chrome when available (PW_CHANNEL=chrome by default), else Playwright's
 * Chromium (`npx playwright install chromium`).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=')
    return [key, rest.length ? rest.join('=') : true]
  }),
)
const baseUrl = String(args.url ?? 'http://127.0.0.1:5173/')
const widths = String(args.widths ?? '390,1440').split(',').map(Number)
const outDir = path.resolve(String(args.out ?? 'docs/screenshots'))
const reduced = Boolean(args.reduced)

async function launch() {
  try {
    return await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
  } catch {
    return chromium.launch()
  }
}

const browser = await launch()
const problems = []
const files = []
await mkdir(outDir, { recursive: true })

for (const width of widths) {
  const phone = width <= 480
  const context = await browser.newContext({
    viewport: { width, height: phone ? 844 : 900 },
    deviceScaleFactor: phone ? 2 : 1,
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  page.on('console', (message) => message.type() === 'error' && problems.push(`console@${width}: ${message.text()}`))
  page.on('pageerror', (error) => problems.push(`pageerror@${width}: ${error.message}`))
  page.on('response', (response) => response.status() >= 400 && problems.push(`http ${response.status()}: ${response.url()}`))

  const shot = async (name) => {
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, Math.abs(scrollX)))
    if (overflow > 1) problems.push(`${name}@${width}: horizontal overflow ${overflow}px`)
    const broken = await page.evaluate(() => [...document.images].filter((img) => img.complete && img.currentSrc && !img.naturalWidth).map((img) => img.currentSrc))
    broken.forEach((src) => problems.push(`${name}@${width}: broken image ${src}`))
    const file = path.join(outDir, `${name}-${phone ? 'mobile' : 'desktop'}${reduced ? '-reduced' : ''}.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality: 84 })
    files.push(file)
  }
  const open = async (hash) => {
    await page.goto(`${baseUrl}${hash}`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' }) // a fresh visit (welcome card again)
    await page.waitForTimeout(1200)
  }
  const tap = async (name, options = {}) => {
    await page.getByRole('button', { name, exact: options.exact ?? false }).first().click({ force: true })
    await page.waitForTimeout(options.wait ?? 700)
  }

  await open('#/')
  await shot('welcome')
  await tap('Mulai tanpa musik', { wait: 1500 })
  await shot('home')
  await tap('Buka buku', { wait: 1800 })
  await shot('letter')

  await open('#/puzzle')
  await tap('Mulai tanpa musik')
  await tap('Siap! Mari Mulai', { wait: 1500 })
  await shot('puzzle')
  for (let i = 0; i < 12; i += 1) await tap('Bantu pasang satu keping', { wait: 250 })
  await page.waitForTimeout(5000)
  await shot('puzzle-done')

  await open('#/kue')
  await tap('Mulai tanpa musik')
  await tap('Siap, Mulai', { wait: 900 })
  for (let i = 0; i < 7; i += 1) await tap('Tambah lilin', { wait: 150 })
  await page.waitForTimeout(800)
  await shot('cake')

  await open('#/galaksi')
  await tap('Mulai tanpa musik', { wait: 2500 })
  await shot('galaxy-start')
  await tap('Sentuh planetnya', { wait: 9000 })
  await shot('galaxy')

  await context.close()
}

await browser.close()
console.log(JSON.stringify({ files, problems }, null, 2))
process.exitCode = problems.length ? 1 : 0
