import { expect, test } from '@playwright/test'

test('flyer preview zooms, changes format and paper, and displays an uploaded image', async ({
  page,
}) => {
  await page.goto('/catalog/flyers')
  const stage = page.getByTestId('print-preview')
  const sheet = page.getByTestId('preview-sheet')
  await expect(stage).toHaveAttribute('data-view', '0')
  const initialWidth = await sheet.evaluate((element) => element.getBoundingClientRect().width)
  await page.getByRole('button', { name: 'Крупный план', exact: true }).click()
  await expect
    .poll(() => sheet.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth * 1.7)
  await page.getByRole('button', { name: 'Фактура бумаги', exact: true }).click()
  await expect
    .poll(() => sheet.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth * 3)
  await page.getByRole('button', { name: 'Общий вид', exact: true }).click()
  await expect
    .poll(async () =>
      Math.abs(
        (await sheet.evaluate((element) => element.getBoundingClientRect().width)) - initialWidth,
      ),
    )
    .toBeLessThan(2)
  await page.getByRole('radio', { name: 'A5', exact: false }).check()
  await expect(stage).toHaveAttribute('data-format', 'a5')
  await expect
    .poll(() => sheet.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth * 1.3)
  await page.getByRole('radio', { name: 'С фактурой', exact: false }).check()
  await expect(sheet).toHaveAttribute('data-paper', 'textured')
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 600
    const context = canvas.getContext('2d')!
    context.fillStyle = '#304e4b'
    context.fillRect(0, 0, 400, 600)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.locator('input[type=file]').setInputFiles({
    name: 'my-print.png',
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  })
  await expect(page.getByAltText('Предпросмотр вашего макета')).toBeVisible()
  await page.getByRole('button', { name: 'Крупный план', exact: true }).click()
  await expect(stage).toHaveAttribute('data-view', '1')
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/artwork.pdf')
  await expect(page.getByText('Первая страница PDF', { exact: false })).toBeVisible()
  await expect(page.getByAltText('Предпросмотр вашего макета')).toBeVisible()
  await page.locator('input[type=file]').setInputFiles({
    name: 'broken.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7 invalid'),
  })
  await expect(page.getByRole('alert')).toContainText('Не удалось открыть PDF')
  await expect(page.getByAltText('Предпросмотр вашего макета')).toHaveCount(0)
})

test('the catalog stays dark despite an old light preference and contains no SVG icons', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('tirazh-appearance-version', 'night-studio-1')
    localStorage.setItem('tirazh-theme', 'light')
  })
  await page.goto('/catalog')
  await expect(page.getByRole('heading', { name: 'Буклеты', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Приглашения', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^(Светлая|Тёмная) тема$/ })).toHaveCount(0)
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('svg')).toHaveCount(0)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy()
})
