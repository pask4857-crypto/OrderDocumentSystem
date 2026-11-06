import { test, expect } from '@playwright/test'

import { prepareAuthenticatedPage } from './helpers/test-helpers.js'

test.describe('基本頁面測試', () => {
  test('未登入時應顯示登入頁面', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login/)
  })

  test('登入頁面應顯示帳號與密碼欄位', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel('帳號：')).toBeVisible()
    await expect(page.getByLabel('密碼：')).toBeVisible()
  })

  test('登入頁面應顯示登入按鈕', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('button', { name: '登入' })).toBeVisible()
  })
})

test.describe('登入功能測試', () => {
  test('使用正確帳密登入後應導向首頁', async ({ page }) => {
    await page.route('http://localhost:5215/api/Auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'test-jwt-token',
          role: 'USER',
        }),
      })
    })

    await page.goto('/login')

    await page.getByLabel('帳號：').fill('test_user')
    await page.getByLabel('密碼：').fill('test_password')
    await page.getByRole('button', { name: '登入' }).click()

    await expect(page).toHaveURL(/\/home$/)

    const token = await page.evaluate(() => localStorage.getItem('token'))

    const role = await page.evaluate(() => localStorage.getItem('role'))

    expect(token).toBe('test-jwt-token')
    expect(role).toBe('USER')
  })

  test('登入失敗時應顯示錯誤訊息', async ({ page }) => {
    await page.route('http://localhost:5215/api/Auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '登入失敗',
        }),
      })
    })

    await page.goto('/login')

    await page.getByLabel('帳號：').fill('wrong_user')
    await page.getByLabel('密碼：').fill('wrong_password')
    await page.getByRole('button', { name: '登入' }).click()

    await expect(page.locator('p')).toHaveText('登入失敗')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('登入後的導覽與狀態測試', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAuthenticatedPage(page)
  })

  test('已登入使用者可以進入首頁', async ({ page }) => {
    await page.goto('/home')

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByRole('button', { name: '登出' })).toBeVisible()
  })

  for (const path of ['/customers', '/products', '/orders']) {
    test(`已登入使用者可以進入 ${path}`, async ({ page }) => {
      await page.goto(path)

      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('button', { name: '登出' })).toBeVisible()
    })
  }

  test('重新整理頁面後應保持登入狀態', async ({ page }) => {
    await page.goto('/home')

    await page.reload()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByRole('button', { name: '登出' })).toBeVisible()
    await expect(page.locator('.user-role')).toHaveText('USER')
  })

  test('登出後應清除登入資訊並導向登入頁面', async ({ page }) => {
    await page.goto('/home')

    await page.getByRole('button', { name: '登出' }).click()

    await expect(page).toHaveURL(/\/login$/)

    const token = await page.evaluate(() => localStorage.getItem('token'))

    const role = await page.evaluate(() => localStorage.getItem('role'))

    expect(token).toBeNull()
    expect(role).toBeNull()
  })

  test('登出後再次進入受保護頁面應導回登入頁面', async ({ page }) => {
    await page.goto('/home')

    await page.getByRole('button', { name: '登出' }).click()

    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/orders')

    await expect(page).toHaveURL(/\/login$/)
  })
})
