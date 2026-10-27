#!/usr/bin/env node
/*
 * Screenshot + quick browser QA helper (uses Playwright).
 *
 *   npm run shots                         # whole app, every chapter, 390 & 1440 px → docs/screenshots
 *   npm run shots -- --widths=320,768     # other widths
 *   npm run shots -- --harness=kenangan   # one chapter via the dev harness (needs `npm run dev`)
 *   npm run shots -- --reduced            # emulate prefers-reduced-motion
 *
 * Options: --url=<base url> (default http://127.0.0.1:5173/), --out=<dir>,
 * --height=<px>, --wait=<ms>, --full (full-page captures), --query=<extra harness query>,
 * --click="Name A;Name B" (harness mode: click buttons by accessible name, in order, before capturing).
 * It also reports console errors, failed requests, broken images and
 * horizontal overflow for every capture, and exits non-zero if any are found.
 *
 * Browser: uses the installed Google Chrome when available (PW_CHANNEL=chrome,
 * the default), otherwise Playwright's bundled Chromium
 * (`npx playwright install chromium`).
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
const height = Number(args.height ?? 900)
const waitMs = Number(args.wait ?? 1400)
const outDir = path.resolve(String(args.out ?? (args.harness ? 'test-results/shots' : 'docs/screenshots')))
const reduced = Boolean(args.reduced)
const full = Boolean(args.full)
const CHAPTERS = ['pembuka', 'kenangan', 'surat', 'hadiah', 'kue', 'bintang']

async function launch() {
  const channel = process.env.PW_CHANNEL ?? 'chrome'
  try {
    return await chromium.launch({ channel })
  } catch {
    return chromium.launch()
  }
}

function watch(page, problems) {
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? ''
    // Media requests are routinely aborted when playback stops; not a bug.
    if (!/ERR_ABORTED/.test(failure)) problems.push(`requestfailed: ${request.url()} ${failure}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`)
  })
}

async function audit(page, label, problems) {
  const result = await page.evaluate(() => {
    const overflow = Math.max(document.documentElement.scrollWidth - window.innerWidth, Math.abs(window.scrollX))
    const broken = [...document.images]
      .filter((img) => img.complete && img.currentSrc && img.naturalWidth === 0)
      .map((img) => img.currentSrc)
    return { overflow, broken }
  })
  if (result.overflow > 1) problems.push(`${label}: horizontal overflow of ${result.overflow}px`)
  result.broken.forEach((src) => problems.push(`${label}: broken image ${src}`))
}

const browser = await launch()
const problems = []
const files = []
await mkdir(outDir, { recursive: true })

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width <= 480 ? 2 : 1,
    isMobile: width <= 480,
    hasTouch: width <= 480,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  watch(page, problems)

  if (args.harness) {
    const query = new URLSearchParams(String(args.query ?? ''))
    query.set('harness', String(args.harness))
    await page.goto(`${baseUrl}?${query}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(waitMs)
    for (const name of String(args.click ?? '').split(';').filter(Boolean)) {
      const button = page.getByRole('button', { name, exact: false }).first()
      await button.scrollIntoViewIfNeeded()
      await button.click()
      await page.waitForTimeout(waitMs)
    }
    const suffix = args.click ? `-${String(args.click).split(';').length}clicks` : ''
    const file = path.join(outDir, `${String(args.harness).replace(/,/g, '+')}-${width}${suffix}${reduced ? '-reduced' : ''}.png`)
    await page.screenshot({ path: file, fullPage: args.full !== 'false' })
    files.push(file)
    await audit(page, `${args.harness}@${width}`, problems)
  } else {
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForTimeout(waitMs)
    const gateFile = path.join(outDir, `${width}-00-gate.png`)
    await page.screenshot({ path: gateFile })
    files.push(gateFile)
    await page.getByRole('button', { name: /tanpa musik/i }).click()
    await page.waitForTimeout(waitMs)
    for (const [index, id] of CHAPTERS.entries()) {
      await page.evaluate((chapterId) => document.getElementById(chapterId)?.scrollIntoView({ block: 'start' }), id)
      await page.waitForTimeout(waitMs)
      const file = path.join(outDir, `${width}-${String(index + 1).padStart(2, '0')}-${id}${reduced ? '-reduced' : ''}.png`)
      await page.screenshot({ path: file, fullPage: full })
      files.push(file)
      await audit(page, `${id}@${width}`, problems)
    }
  }
  await context.close()
}

await browser.close()
console.log(JSON.stringify({ files, problems }, null, 2))
process.exitCode = problems.length ? 1 : 0
