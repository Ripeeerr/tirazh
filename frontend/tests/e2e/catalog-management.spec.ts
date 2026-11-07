import { expect, test } from '@playwright/test'

test('manager publishes a product and the storefront calculates its price', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('manager@example.com')
  await page.getByLabel('Пароль', { exact: true }).fill('manager-password')
  await page.getByRole('button', { name: 'Войти и продолжить' }).click()
  await expect(page).toHaveURL(/\/account\/orders$/)
  await page.goto('/manager/orders')
  await page.getByRole('link', { name: 'Добавить товар', exact: true }).click()
  await expect(page).toHaveURL(/\/manager\/products\/new$/)
  const slug = `calendar-${crypto.randomUUID().slice(0, 8)}`
  await page.getByLabel('Название товара').fill('Тестовый календарь')
  await page.getByLabel('Адрес страницы').fill(slug)
  await page.getByLabel('Описание', { exact: true }).fill('Печать календарей с вашим макетом')
  await page.getByLabel('Базовая цена за штуку, ₽').fill('25')
  await page.getByLabel('Доступные тиражи').fill('100, 250')
  await page.getByRole('button', { name: 'Сохранить и открыть товар' }).click()
  await expect(page).toHaveURL(new RegExp(`/catalog/${slug}$`))
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тестовый календарь')
  await expect(page.getByText('3 000', { exact: false }).first()).toBeVisible()
})

test('text-field focus highlights the input without outlining its label', async ({ page }) => {
  await page.goto('/login')
  const email = page.getByLabel('Email', { exact: true })
  await email.focus()
  await expect(email).toHaveCSS('outline-style', 'solid')
  await expect(email).toHaveCSS('outline-width', '2px')
  await expect(email).toHaveCSS('outline-offset', '2px')
  expect(
    await email.evaluate((element) => getComputedStyle(element.parentElement!).outlineStyle),
  ).toBe('none')
  await expect(email).toHaveCSS('box-shadow', 'none')
})
