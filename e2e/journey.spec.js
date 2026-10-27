import { expect, test } from '@playwright/test'

/* Collects console errors, uncaught exceptions and failed requests. */
function watch(page) {
  const problems = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? ''
    if (!/ERR_ABORTED/.test(failure)) problems.push(`requestfailed: ${request.url()} ${failure}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`)
  })
  return problems
}

async function openWithoutMusic(page) {
  await page.goto('./')
  await expect(page.getByRole('dialog', { name: 'Untuk Aya' })).toBeVisible()
  await page.getByRole('button', { name: 'Buka tanpa musik' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

// The visible counter (the screen-reader live region repeats the same text).
const counter = (page) => page.locator('p:not([aria-live])', { hasText: /^Foto \d+ dari 10$/ })

test('the whole journey works from the gate to the final surprise', async ({ page }) => {
  const problems = watch(page)
  await openWithoutMusic(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Selamat Ulang Tahun, Aya' })).toBeVisible()

  // Memories
  await page.getByRole('button', { name: /Mulai perjalanan/ }).click()
  await expect(page).toHaveURL(/#kenangan$/)
  await page.getByRole('button', { name: 'Foto sebelumnya' }).click()
  await expect(counter(page)).toHaveText('Foto 10 dari 10')
  await page.getByRole('button', { name: 'Foto berikutnya' }).click()
  await expect(counter(page)).toHaveText('Foto 1 dari 10')
  await page.getByRole('button', { name: /Lihat lebih besar/ }).click()
  const viewer = page.getByRole('dialog', { name: 'Foto 1 dari 10' })
  await expect(viewer).toBeVisible()
  await expect(viewer.getByRole('img')).toHaveJSProperty('complete', true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  // Letter
  await page.getByRole('button', { name: 'Buka buku' }).click()
  await expect(page.getByRole('heading', { name: 'Selamat Ulang Tahun ke-18, Ayaaa Tersayang!' })).toBeVisible()
  await page.getByRole('button', { name: 'Buka!' }).click()
  await expect(page).toHaveURL(/#hadiah$/)

  // Puzzle
  await page.getByRole('button', { name: 'Siap! Mari Mulai' }).click()
  const board = page.getByRole('group', { name: /Papan puzzle/ })
  await expect(board.getByRole('button')).toHaveCount(12)
  await board.getByRole('button').nth(0).click()
  await board.getByRole('button').nth(1).click()
  await expect(page.getByText(/1 langkah/)).toBeVisible()
  await page.getByRole('button', { name: 'Bantu susun' }).click()
  await expect(page.getByRole('heading', { name: 'Tuhkan Cayang Pasti Bisa!' })).toBeVisible()
  await page.getByRole('button', { name: 'Buka Hadiah Aya' }).click()
  await expect(page).toHaveURL(/#kue$/)

  // Cake
  await page.getByRole('button', { name: 'Siap, Mulai' }).click()
  await page.getByRole('button', { name: 'Taruh lilin di sini' }).click()
  await expect(page.getByText(/Lilin di atas kue:\s*1/)).toBeVisible()
  await page.getByRole('button', { name: 'Pasang 18 lilin' }).click()
  await expect(page.getByText(/Lilin di atas kue:\s*18/)).toBeVisible()
  // 18 flames sit close together; blow one specific flame via the keyboard path.
  await page.getByRole('button', { name: 'Tiup lilin 5' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Tiup lilin 5' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Tiup lilinnya' }).click()
  await expect(page.getByText('Semua lilin padam', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Lanjut ke kejutan terakhir' }).click()
  await expect(page).toHaveURL(/#bintang$/)

  // Final surprise
  const secret = page.getByLabel('Kata rahasia')
  await secret.fill('halo')
  await page.getByRole('button', { name: 'Buka', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('belum tepat')
  await secret.fill('ayil sayang aya')
  await page.getByRole('button', { name: 'Buka', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Happy Birthday Ayaa!' })).toBeVisible()
  for (const text of ['♡Happy Birthday Sayang♡', 'I love you', 'Always & Forever', '18/05/2026']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible()
  }
  await expect(page.getByRole('img', { name: /Galaksi biru/ })).toBeVisible() // WebGL scene mounted
  await page.waitForTimeout(1500)

  // The browser Back button walks back through chapters.
  await page.goBack()
  await expect(page).toHaveURL(/#kue$/)

  expect(problems).toEqual([])
})

test('music starts from the gate button, pauses, and never asks for the microphone', async ({ page }) => {
  const problems = watch(page)
  await page.addInitScript(() => {
    window.__micRequests = 0
    const devices = navigator.mediaDevices
    if (devices?.getUserMedia) {
      const original = devices.getUserMedia.bind(devices)
      devices.getUserMedia = (...args) => {
        window.__micRequests += 1
        return original(...args)
      }
    }
  })
  await page.goto('./')
  const audioResponse = page.waitForResponse((response) => /backsound[^/]*\.(m4a|mp3)/.test(response.url()))
  await page.getByRole('button', { name: 'Buka kejutan' }).click()
  expect((await audioResponse).status()).toBeLessThan(400)
  await expect(page.getByRole('button', { name: 'Jeda musik' })).toBeVisible()
  await page.getByRole('button', { name: 'Jeda musik' }).click()
  await expect(page.getByRole('button', { name: 'Putar musik' })).toBeVisible()
  expect(await page.evaluate(() => window.__micRequests)).toBe(0)
  expect(problems).toEqual([])
})

test('progress survives a refresh and assets resolve after reload', async ({ page }) => {
  await openWithoutMusic(page)
  await page.locator('#hadiah').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Siap! Mari Mulai' }).click()
  await page.getByRole('button', { name: 'Bantu susun' }).click()
  await expect(page.getByRole('heading', { name: 'Tuhkan Cayang Pasti Bisa!' })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Buka tanpa musik' }).click()
  await page.locator('#hadiah').scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: 'Tuhkan Cayang Pasti Bisa!' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Ayil dan Aya/ })).toHaveJSProperty('complete', true)
})

test('reduced motion keeps the story complete with a static finale', async ({ page }) => {
  const problems = watch(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openWithoutMusic(page)
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await expect(page.getByRole('button', { name: /putar otomatis/i })).toHaveCount(0)
  await page.locator('#bintang').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Buka tanpa kata rahasia' }).click()
  await expect(page.getByRole('heading', { name: 'Happy Birthday Ayaa!' })).toBeVisible()
  await expect(page.locator('#bintang canvas')).toHaveCount(0)
  expect(problems).toEqual([])
})

test('no horizontal overflow at common widths', async ({ page }) => {
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 860 })
    await openWithoutMusic(page)
    for (const id of ['pembuka', 'kenangan', 'surat', 'hadiah', 'kue', 'bintang']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth - window.innerWidth, Math.abs(window.scrollX)))
      expect(overflow, `${id} @ ${width}px`).toBeLessThanOrEqual(1)
    }
  }
})
