import { expect, test } from '@playwright/test'

test('the night studio home opens in dark mode and leads into the live configurator', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.removeItem('tirazh-appearance-version')
    localStorage.removeItem('tirazh-theme')
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Печатать')
  await expect(
    page.getByRole('img', {
      name: 'Фактурная бумага, стопка визиток и жёлтые постеры в студии печати',
    }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Выбрать продукцию', exact: true }).click()
  await page
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: 'Листовки', exact: true }) })
    .click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Листовки')
  await expect(page.getByTestId('print-preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Оформить заказ', exact: true })).toBeEnabled()
})

test('night studio content and order controls fit a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  for (const path of ['/', '/catalog', '/catalog/flyers', '/login', '/delivery']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy()
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  }
  await page.goto('/catalog/flyers')
  await expect(page.getByRole('button', { name: 'Оформить заказ', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Оформить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Проверим ваш тираж')
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy()
})

test('the how-it-works link scrolls again when its hash is already active', async ({ page }) => {
  await page.goto('/#process')
  const section = page.locator('#process')
  await expect(section).toBeVisible()
  await expect
    .poll(() => section.evaluate((element) => Math.abs(element.getBoundingClientRect().top)))
    .toBeLessThan(2)
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.getByRole('link', { name: 'Как это работает', exact: true }).click()
    await expect(page).toHaveURL(/\/#process$/)
    await expect
      .poll(() => section.evaluate((element) => Math.abs(element.getBoundingClientRect().top)))
      .toBeLessThan(2)
  }
})
