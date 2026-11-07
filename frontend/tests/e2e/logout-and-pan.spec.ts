import { expect, test } from '@playwright/test'

test('logout clears the header, survives reload and allows another login', async ({ page }) => {
  const email = `logout-${crypto.randomUUID()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Ваше имя').fill('Тестовый пользователь')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Пароль', { exact: true }).fill('client-password')
  await page.getByRole('button', { name: 'Создать аккаунт и продолжить' }).click()
  await expect(page).toHaveURL(/\/account\/orders$/)
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Войти', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Войти', exact: true })).toBeVisible()
  await page.goto('/account/profile')
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Пароль', { exact: true }).fill('client-password')
  await page.getByRole('button', { name: 'Войти и продолжить' }).click()
  await expect(page).toHaveURL(/\/account\/profile$/)
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Войти', exact: true })).toBeVisible()
})

test('manual zoom never drops below 1x and enlarged artwork can be dragged', async ({ page }) => {
  await page.goto('/catalog/business-cards')
  const stage = page.getByTestId('print-preview')
  await expect(stage).toHaveAttribute('data-zoom', '1')
  await expect(page.getByRole('button', { name: 'Отдалить', exact: true })).toBeDisabled()
  const range = page.getByRole('slider', { name: 'Масштаб макета' })
  await range.focus()
  await range.press('End')
  await expect(stage).toHaveAttribute('data-zoom', '6')
  await stage.scrollIntoViewIfNeeded()
  const box = (await stage.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect(stage).toHaveAttribute('data-interacting', 'true')
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 45, { steps: 6 })
  await page.mouse.up()
  await expect(stage).toHaveAttribute('data-interacting', 'false')
  await expect.poll(() => stage.getAttribute('data-pan-x').then(Number)).toBeGreaterThan(40)
  await page.getByRole('button', { name: 'Общий вид', exact: true }).click()
  await expect(stage).toHaveAttribute('data-zoom', '1')
  await expect(stage).toHaveAttribute('data-pan-x', '0')
  await expect(stage).toHaveAttribute('data-pan-y', '0')
  await range.focus()
  await range.press('Home')
  await range.press('ArrowLeft')
  await expect(stage).toHaveAttribute('data-zoom', '1')
  await expect(page.getByRole('button', { name: 'Крупный план', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Фактура бумаги', exact: true })).toBeVisible()
})

test('two-finger zoom and touch dragging work inside the preview', async ({ page }) => {
  await page.goto('/catalog/business-cards')
  const stage = page.getByTestId('print-preview')
  await expect(stage).toHaveAttribute('data-zoom', '1')
  await stage.scrollIntoViewIfNeeded()
  const box = (await stage.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  const session = await page.context().newCDPSession(page)
  try {
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x - 25, y, id: 1 },
        { x: x + 25, y, id: 2 },
      ],
    })
    for (const spread of [30, 40, 50]) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: x - spread, y, id: 1 },
          { x: x + spread, y, id: 2 },
        ],
      })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => stage.getAttribute('data-zoom').then(Number)).toBeGreaterThan(1.7)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 3 }],
    })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 40, y: y + 20, id: 3 }],
    })
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => stage.getAttribute('data-pan-x').then(Number)).toBeGreaterThan(20)
  } finally {
    await session.detach()
  }
})

test('artwork can be moved with buttons and recentered at 1x', async ({ page }) => {
  await page.goto('/catalog/business-cards')
  const stage = page.getByTestId('print-preview')
  await page.getByText('Переместить макет', { exact: true }).click()
  const left = page.getByRole('button', { name: 'Влево', exact: true })
  await expect(left).toBeDisabled()
  await page.getByRole('slider', { name: 'Масштаб макета' }).focus()
  await page.getByRole('slider', { name: 'Масштаб макета' }).press('End')
  await left.click()
  await expect(stage).toHaveAttribute('data-pan-x', '-48')
  await page.getByRole('button', { name: 'Вверх', exact: true }).click()
  await expect(stage).toHaveAttribute('data-pan-y', '-48')
  await page.getByRole('button', { name: 'Общий вид', exact: true }).click()
  await expect(stage).toHaveAttribute('data-pan-x', '0')
  await expect(stage).toHaveAttribute('data-pan-y', '0')
  await expect(left).toBeDisabled()
})
