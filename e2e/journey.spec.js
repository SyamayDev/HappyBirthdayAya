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

async function startWithoutMusic(page, path = './') {
  await page.goto(path)
  await page.reload() // a fresh visit always starts with the welcome card
  await expect(page.getByRole('dialog', { name: 'Selamat Datang!' })).toBeVisible()
  await page.getByRole('button', { name: 'Mulai tanpa musik' }).click()
  await expect(page.getByRole('dialog', { name: 'Selamat Datang!' })).toBeHidden()
}

test('the whole journey works like the original four pages', async ({ page }) => {
  const problems = watch(page)
  await startWithoutMusic(page)

  // Home: photo ring + book
  const ring = page.getByRole('region', { name: 'Foto-foto Aya' })
  await expect(ring.getByRole('button')).toHaveCount(10)
  // Keyboard focus turns the ring to that photo and pauses it; Enter opens it.
  await ring.getByRole('button').nth(3).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Foto 4 dari 10' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('button', { name: 'Buka buku' }).click({ force: true })
  await expect(page.getByRole('heading', { name: 'Selamat Ulang Tahun ke-18, Ayaaa Tersayang!' })).toBeVisible()
  await page.getByRole('button', { name: 'Buka!' }).click()
  await expect(page).toHaveURL(/#\/puzzle$/)

  // Puzzle: drag one real piece into its slot, then let "Bantu" finish
  await page.getByRole('button', { name: 'Siap! Mari Mulai' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.waitForTimeout(900) // pieces fly out to their scattered places
  const piece = page.getByRole('button', { name: /^Keping 1\./ })
  const board = await page.locator('[class*="board"]').first().boundingBox()
  const box = await piece.boundingBox()
  const size = board.width / 3
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(board.x + size / 2, board.y + size / 2, { steps: 12 })
  await page.mouse.up()
  await expect(page.getByRole('button', { name: /^Keping 1, sudah terpasang/ })).toBeAttached()
  for (let i = 0; i < 11; i += 1) await page.getByRole('button', { name: 'Bantu pasang satu keping' }).click()
  await expect(page.getByRole('dialog', { name: 'Tuhkan Cayang Pasti Bisa!' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Buka Hadiah Aya' }).click()
  await expect(page).toHaveURL(/#\/kue$/)

  // Cake
  await page.getByRole('button', { name: 'Siap, Mulai' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('button', { name: 'Taruh lilin di kue' }).click({ force: true })
  await page.getByRole('button', { name: 'Tambah lilin' }).click()
  await expect(page.getByText(/Lilin di atas kue:\s*2/)).toBeVisible()
  await page.getByRole('button', { name: 'Tiup', exact: true }).click()
  await expect(page.getByText('Ucapkan kata rahasia untuk kejutan!')).toBeVisible()
  await page.getByLabel('Kata rahasia').fill('ayil sayang aya')
  await page.getByRole('button', { name: 'Buka', exact: true }).click()
  await expect(page).toHaveURL(/#\/galaksi$/)

  // Galaxy: touch the planet, fly, explore
  await page.getByRole('button', { name: /Sentuh planetnya/ }).click()
  await expect(page.getByText('Aya & Ayil')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Putar ulang' })).toBeVisible()

  // Back button returns to the previous page
  await page.goBack()
  await expect(page).toHaveURL(/#\/kue$/)

  expect(problems).toEqual([])
})

test('music starts from the welcome card, pauses, and never asks for the microphone', async ({ page }) => {
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
  // the start button gently pulses forever, so skip Playwright's "stable" wait
  await page.getByRole('button', { name: 'Mulai', exact: true }).click({ force: true })
  expect((await audioResponse).status()).toBeLessThan(400)
  await expect(page.getByRole('button', { name: 'Jeda musik' })).toBeVisible()
  await page.getByRole('button', { name: 'Jeda musik' }).click()
  await expect(page.getByRole('button', { name: 'Putar musik' })).toBeVisible()
  expect(await page.evaluate(() => window.__micRequests)).toBe(0)
  expect(problems).toEqual([])
})

test('every page can be opened directly (refresh-safe) and assets load', async ({ page }) => {
  const problems = watch(page)
  for (const [path, title] of [
    ['./#/', 'Selamat Ulang Tahun, Aya!'],
    ['./#/puzzle', 'Susun Puzzle-nya!'],
    ['./#/kue', 'Tiup Lilinnya!'],
    ['./#/galaksi', 'Kejutan Terakhir!'],
  ]) {
    await page.goto(path)
    await expect(page).toHaveTitle(title)
    await page.reload()
    await expect(page.getByRole('dialog', { name: 'Selamat Datang!' })).toBeVisible()
  }
  expect(problems).toEqual([])
})

test('reduced motion: everything still works, finale uses the static sky', async ({ page }) => {
  const problems = watch(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startWithoutMusic(page, './#/galaksi')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await expect(page.getByText('Happy Birthday Ayaa!')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: /Kembali ke awal/ }).click()
  await expect(page).toHaveURL(/#\/$/)
  expect(problems).toEqual([])
})

test('no horizontal overflow on any page at common widths', async ({ page }) => {
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    for (const path of ['./#/', './#/puzzle', './#/kue', './#/galaksi']) {
      await startWithoutMusic(page, path)
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth - window.innerWidth, Math.abs(window.scrollX)))
      expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(1)
    }
  }
})
