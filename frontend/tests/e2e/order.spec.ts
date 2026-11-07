import { expect, test } from '@playwright/test'

test('customer registers during checkout and manager requests a revised artwork', async ({
  page,
  browser,
}) => {
  const email = `client-${crypto.randomUUID()}@example.com`
  await page.goto('/catalog/business-cards')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Визитки')
  await expect(page.getByText('4 800', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Оформить заказ' }).click()
  await page.getByLabel('Ваше имя').fill('Анна Павлова')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Пароль', { exact: true }).fill('client-password')
  await page.getByRole('button', { name: 'Создать аккаунт и продолжить' }).click()
  await page.getByLabel('Телефон', { exact: true }).fill('+7 999 123-45-67')
  await page.locator('input[type=file]').setInputFiles({
    name: 'artwork.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\nportfolio-demo'),
  })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()
  await expect(page).toHaveURL(/\/account\/orders\/[\w-]+/)
  await expect(page.getByText('Заказ оформлен.', { exact: false })).toBeVisible()
  const orderId = new URL(page.url()).pathname.split('/').at(-1)!
  const managerContext = await browser.newContext()
  const manager = await managerContext.newPage()
  await manager.goto('http://localhost:5174/login')
  await manager.getByLabel('Email', { exact: true }).fill('manager@example.com')
  await manager.getByLabel('Пароль', { exact: true }).fill('manager-password')
  await manager.getByRole('button', { name: 'Войти и продолжить' }).click()
  await expect(manager).toHaveURL(/\/account\/orders$/)
  await manager.goto(`http://localhost:5174/manager/orders/${orderId}`)
  await manager.getByRole('button', { name: 'Проверка макета', exact: true }).click()
  await expect(
    manager.getByRole('button', { name: 'Нужны исправления', exact: true }),
  ).toBeVisible()
  await manager.getByLabel('Причина / пояснение').fill('Добавьте вылеты по 3 мм')
  await manager.getByRole('button', { name: 'Нужны исправления', exact: true }).click()
  await expect(manager.getByRole('button', { name: 'Проверка макета', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Добавьте вылеты по 3 мм')).toBeVisible()
  await page.locator('input[type=file]').setInputFiles({
    name: 'artwork-v2.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\nrevised-demo'),
  })
  await page.getByRole('button', { name: 'Отправить на повторную проверку' }).click()
  await expect(page.getByText('artwork-v2.pdf', { exact: true })).toBeVisible()
  await managerContext.close()
})

test('configurator works on a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/catalog/business-cards')
  await page.getByRole('radio', { name: 'Матовая', exact: false }).check()
  await expect(page.getByText('6 000', { exact: false }).first()).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy()
})
