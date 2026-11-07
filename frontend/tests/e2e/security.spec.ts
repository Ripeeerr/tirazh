import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('stored HTML in an order and comment is shown as text without executing', async ({ page }) => {
  const payload = '<img src=x onerror="window.__tirazhXss=true">'
  const registration = await page.request.post('/api/auth/register', {
    data: {
      email: `security-${crypto.randomUUID()}@example.com`,
      name: 'Клиент',
      password: 'client-password',
    },
  })
  expect(registration.status()).toBe(201)
  const upload = await page.request.post('/api/files', {
    data: await readFile('tests/fixtures/artwork.pdf'),
    headers: { 'X-Filename': 'artwork.pdf', 'Content-Type': 'application/octet-stream' },
  })
  expect(upload.status()).toBe(201)
  const artwork = await upload.json()
  const creation = await page.request.post('/api/orders', {
    data: {
      product_slug: 'business-cards',
      format: 'standard',
      paper: 'standard',
      printing: 'double',
      quantity: 500,
      artwork_id: artwork.id,
      contact_name: payload,
      contact_phone: '+79991234567',
      note: payload,
    },
  })
  expect(creation.status()).toBe(201)
  const order = await creation.json()
  const comment = await page.request.post(`/api/orders/${order.id}/comments`, {
    data: { body: payload },
  })
  expect(comment.status()).toBe(201)
  await page.goto(`/account/orders/${order.id}`)
  await expect(page.getByText(payload, { exact: true }).first()).toBeVisible()
  await expect(page.locator('img[src="x"]')).toHaveCount(0)
  expect(await page.evaluate(() => Object.hasOwn(window, '__tirazhXss'))).toBe(false)
})
