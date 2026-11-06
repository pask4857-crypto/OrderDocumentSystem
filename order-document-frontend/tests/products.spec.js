import { test, expect } from '@playwright/test'

import {
  mockProducts,
  prepareAuthenticatedPage,
  prepareAdminPage,
  mockProductList,
} from './helpers/test-helpers.js'

test.describe('商品管理測試', () => {
  test('應正確顯示商品列表', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await mockProductList(page)

    await page.goto('/products')

    await expect(page.getByRole('heading', { name: '商品管理' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '商品列表' })).toBeVisible()

    const rows = page.locator('tbody tr')

    await expect(rows).toHaveCount(2)

    await expect(rows.nth(0)).toContainText('測試商品 A')
    await expect(rows.nth(0)).toContainText('100')
    await expect(rows.nth(0)).toContainText('10')

    await expect(rows.nth(1)).toContainText('測試商品 B')
    await expect(rows.nth(1)).toContainText('250')
    await expect(rows.nth(1)).toContainText('20')
  })

  test('一般使用者只能檢視商品資料', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await mockProductList(page)

    await page.goto('/products')

    // 確認商品列表正常顯示
    await expect(page.getByRole('heading', { name: '商品管理' })).toBeVisible()

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(2)

    // 一般使用者不應看到新增商品表單
    await expect(page.locator('.form-section')).toHaveCount(0)

    // 一般使用者不應看到編輯與刪除按鈕
    await expect(page.getByRole('button', { name: '編輯' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '刪除' })).toHaveCount(0)
  })

  test('管理員可以新增商品', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    // 模擬新增商品 API
    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            name: '新增測試商品',
            price: 350,
            stock: 15,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    // 填寫商品資料
    await page.locator('#product-name').fill('新增測試商品')
    await page.locator('#product-price').fill('350')
    await page.locator('#product-stock').fill('15')

    // 送出新增商品表單
    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認新增成功訊息
    await expect(page.getByText('商品新增成功。')).toBeVisible()
  })

  test('管理員可以編輯商品', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    // 模擬更新商品 API
    await page.route('http://localhost:5215/api/Products/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            name: '測試商品 A',
            price: 180,
            stock: 25,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    // 開啟第一筆商品的編輯表單
    await page.locator('tbody tr').nth(0).getByRole('button', { name: '編輯' }).click()

    // 確認原始資料已帶入表單
    await expect(page.locator('#product-name')).toHaveValue('測試商品 A')
    await expect(page.locator('#product-price')).toHaveValue('100')
    await expect(page.locator('#product-stock')).toHaveValue('10')

    // 修改價格與庫存
    await page.locator('#product-price').fill('180')
    await page.locator('#product-stock').fill('25')

    // 送出修改
    await page.getByRole('button', { name: '儲存修改' }).click()

    // 確認更新成功
    await expect(page.getByText('商品更新成功。')).toBeVisible()
  })

  test('管理員可以取消編輯商品', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    await page.goto('/products')

    // 開啟第一筆商品的編輯表單
    await page.locator('tbody tr').nth(0).getByRole('button', { name: '編輯' }).click()

    // 確認進入編輯模式
    await expect(page.getByRole('heading', { name: '編輯商品' })).toBeVisible()

    await expect(page.locator('#product-name')).toHaveValue('測試商品 A')

    // 取消編輯
    await page.getByRole('button', { name: '取消編輯' }).click()

    // 確認恢復新增商品模式
    await expect(page.getByRole('heading', { name: '新增商品' })).toBeVisible()

    // 確認表單欄位已重設
    await expect(page.locator('#product-name')).toHaveValue('')
    await expect(page.locator('#product-price')).toHaveValue('0')
    await expect(page.locator('#product-stock')).toHaveValue('0')
  })

  test('管理員可以刪除商品', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    let deleteRequestCount = 0

    await page.route('http://localhost:5215/api/Products/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestCount++

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '商品刪除成功。' }),
        })
      } else {
        await route.continue()
      }
    })

    // 自動接受刪除確認視窗
    page.on('dialog', (dialog) => dialog.accept())

    await page.goto('/products')

    // 刪除第一筆商品
    await page.locator('tbody tr').nth(0).getByRole('button', { name: '刪除' }).click()

    // 確認刪除成功訊息
    await expect(page.getByText('商品刪除成功。')).toBeVisible()

    // 確認確實送出一次 DELETE 請求
    expect(deleteRequestCount).toBe(1)
  })

  test('管理員可以取消刪除商品', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    let deleteRequestCount = 0

    await page.route('http://localhost:5215/api/Products/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestCount++

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '商品刪除成功。' }),
        })
      } else {
        await route.continue()
      }
    })

    // 自動取消刪除確認視窗
    page.on('dialog', (dialog) => dialog.dismiss())

    await page.goto('/products')

    // 嘗試刪除第一筆商品
    await page.locator('tbody tr').nth(0).getByRole('button', { name: '刪除' }).click()

    // 確認沒有送出 DELETE 請求
    expect(deleteRequestCount).toBe(0)

    // 確認商品仍然存在
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText('測試商品 A')

    // 不應顯示刪除成功訊息
    await expect(page.getByText('商品刪除成功。')).toHaveCount(0)
  })

  test('新增商品時名稱只有空白字元應顯示錯誤', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    let postRequestCount = 0

    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        postRequestCount++

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 3 }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    // 輸入只有空白字元的商品名稱
    await page.locator('#product-name').fill('   ')
    await page.locator('#product-price').fill('100')
    await page.locator('#product-stock').fill('10')

    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認顯示前端驗證錯誤
    await expect(page.getByText('請輸入商品名稱。')).toBeVisible()

    // 確認沒有送出 POST 請求
    expect(postRequestCount).toBe(0)
  })

  test('新增商品時價格不可小於 0', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    let postRequestCount = 0

    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        postRequestCount++

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 3 }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    await page.locator('#product-name').fill('價格驗證測試商品')
    await page.locator('#product-price').fill('-10')
    await page.locator('#product-stock').fill('10')

    // 確認價格欄位因為 min="0" 而無效
    await expect(page.locator('#product-price')).toHaveJSProperty('validity.rangeUnderflow', true)

    // 嘗試送出表單
    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認瀏覽器阻止送出 POST 請求
    expect(postRequestCount).toBe(0)
  })

  test('新增商品時庫存必須是整數', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    let postRequestCount = 0

    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        postRequestCount++

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 3 }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    await page.locator('#product-name').fill('庫存驗證測試商品')
    await page.locator('#product-price').fill('100')
    await page.locator('#product-stock').fill('1.5')

    // 確認庫存欄位因為 step="1" 而無效
    await expect(page.locator('#product-stock')).toHaveJSProperty('validity.stepMismatch', true)

    // 嘗試送出表單
    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認瀏覽器阻止送出 POST 請求
    expect(postRequestCount).toBe(0)
  })

  test('取得商品資料失敗時應顯示錯誤訊息', async ({ page }) => {
    await prepareAuthenticatedPage(page)

    // 模擬商品列表 API 發生伺服器錯誤
    await page.route('http://localhost:5215/api/Products', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal Server Error',
        }),
      })
    })

    await page.goto('/products')

    // 確認顯示伺服器錯誤訊息
    await expect(page.getByText('Internal Server Error')).toBeVisible()

    // 確認沒有顯示商品資料
    await expect(page.locator('tbody tr')).toHaveCount(0)
  })

  test('新增商品資料錯誤時應顯示錯誤訊息', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    // 模擬新增商品 API 回傳 HTTP 400
    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    await page.locator('#product-name').fill('錯誤資料測試商品')
    await page.locator('#product-price').fill('100')
    await page.locator('#product-stock').fill('10')

    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認顯示 HTTP 400 對應的錯誤訊息
    await expect(page.getByText('商品資料不正確，請檢查輸入內容。')).toBeVisible()
  })

  test('管理員新增商品時遇到 HTTP 403 應顯示權限不足訊息', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    // 模擬新增商品 API 回傳 HTTP 403
    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    await page.locator('#product-name').fill('權限測試商品')
    await page.locator('#product-price').fill('100')
    await page.locator('#product-stock').fill('10')

    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認顯示權限不足訊息
    await expect(page.getByText('你沒有權限執行此操作。')).toBeVisible()
  })

  test('管理員編輯商品時遇到 HTTP 404 應顯示找不到商品訊息', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    // 模擬更新商品 API 回傳 HTTP 404
    await page.route('http://localhost:5215/api/Products/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    // 開啟第一筆商品的編輯表單
    await page.locator('tbody tr').nth(0).getByRole('button', { name: '編輯' }).click()

    // 送出修改
    await page.locator('#product-price').fill('180')
    await page.getByRole('button', { name: '儲存修改' }).click()

    // 確認顯示找不到商品的訊息
    await expect(page.getByText('找不到指定的商品。')).toBeVisible()
  })

  test('管理員新增商品時遇到 HTTP 500 應顯示伺服器錯誤訊息', async ({ page }) => {
    await prepareAdminPage(page)
    await mockProductList(page)

    // 模擬新增商品 API 回傳 HTTP 500
    await page.route('http://localhost:5215/api/Products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/products')

    await page.locator('#product-name').fill('伺服器錯誤測試商品')
    await page.locator('#product-price').fill('100')
    await page.locator('#product-stock').fill('10')

    await page.getByRole('button', { name: '新增商品' }).click()

    // 確認顯示伺服器錯誤訊息
    await expect(page.getByText('伺服器發生錯誤，請稍後再試。')).toBeVisible()
  })

  test('取得商品資料時遇到 HTTP 403 應顯示權限不足訊息', async ({ page }) => {
    await prepareAuthenticatedPage(page)

    // 模擬商品列表 API 回傳 HTTP 403
    await page.route('http://localhost:5215/api/Products', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    await page.goto('/products')

    // 確認顯示查看商品的權限錯誤訊息
    await expect(page.getByText('你沒有權限查看商品。')).toBeVisible()

    // 確認沒有顯示商品資料
    await expect(page.locator('tbody tr')).toHaveCount(0)
  })
})
