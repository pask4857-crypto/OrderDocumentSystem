import { test, expect } from '@playwright/test'

import {
  mockCustomers,
  prepareAuthenticatedPage,
  prepareAdminPage,
  mockCustomerList,
} from './helpers/test-helpers.js'

test.describe('客戶管理測試', () => {
  test('應正確顯示客戶列表', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await mockCustomerList(page)

    await page.goto('/customers')

    // 確認客戶資料正確顯示
    await expect(page.getByRole('heading', { name: '客戶管理' })).toBeVisible()

    await expect(page.getByText('測試客戶 A')).toBeVisible()
    await expect(page.getByText('customer-a@example.com')).toBeVisible()

    await expect(page.getByText('測試客戶 B')).toBeVisible()
    await expect(page.getByText('customer-b@example.com')).toBeVisible()

    // 確認資料筆數
    await expect(page.locator('.result-count')).toHaveText('共 2 筆客戶資料')
  })

  test('一般使用者只能檢視客戶資料', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await mockCustomerList(page)

    await page.goto('/customers')

    // 確認客戶資料可以正常顯示
    await expect(page.getByText('測試客戶 A')).toBeVisible()

    // 一般使用者不應看到新增、編輯及刪除按鈕
    await expect(page.getByRole('button', { name: '新增客戶' })).toHaveCount(0)

    await expect(page.getByRole('button', { name: '編輯' })).toHaveCount(0)

    await expect(page.getByRole('button', { name: '刪除' })).toHaveCount(0)

    // 確認顯示唯讀提示
    await expect(page.getByText('僅供檢視').first()).toBeVisible()
  })

  test('管理員可以新增客戶', async ({ page }) => {
    await prepareAdminPage(page)

    let customers = [...mockCustomers]
    let createdCustomer = null

    // 模擬取得客戶列表
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(customers),
        })
      } else if (route.request().method() === 'POST') {
        createdCustomer = route.request().postDataJSON()

        customers.push({
          id: 3,
          ...createdCustomer,
        })

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            ...createdCustomer,
          }),
        })
      }
    })

    await page.goto('/customers')

    // 開啟新增表單
    await page.getByRole('button', { name: '新增客戶' }).click()

    await expect(page.getByRole('heading', { name: '新增客戶' })).toBeVisible()

    // 填寫客戶資料
    await page.getByLabel('客戶名稱').fill('新增測試客戶')
    await page.getByLabel('Email').fill('new-customer@example.com')

    // 儲存
    await page.getByRole('button', { name: '儲存' }).click()

    // 確認 POST 傳送的資料
    expect(createdCustomer).toEqual({
      name: '新增測試客戶',
      email: 'new-customer@example.com',
    })

    // 確認成功訊息及列表更新
    await expect(page.getByText('新增客戶成功。')).toBeVisible()

    await expect(page.getByText('新增測試客戶')).toBeVisible()

    await expect(page.locator('.result-count')).toHaveText('共 3 筆客戶資料')
  })

  test('管理員可以編輯客戶', async ({ page }) => {
    await prepareAdminPage(page)

    let customers = [...mockCustomers]
    let updatedCustomer = null

    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(customers),
        })
      }
    })

    await page.route('http://localhost:5215/api/Customers/1', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedCustomer = route.request().postDataJSON()

        customers = customers.map((customer) =>
          customer.id === 1 ? { ...customer, ...updatedCustomer } : customer,
        )

        await route.fulfill({
          status: 204,
        })
      }
    })

    await page.goto('/customers')

    // 開啟第一筆客戶的編輯表單
    await page.getByRole('button', { name: '編輯' }).first().click()

    await expect(page.getByRole('heading', { name: '編輯客戶' })).toBeVisible()

    // 確認原始資料已帶入表單
    await expect(page.getByLabel('客戶名稱')).toHaveValue('測試客戶 A')

    await expect(page.getByLabel('Email')).toHaveValue('customer-a@example.com')

    // 修改資料
    await page.getByLabel('客戶名稱').fill('修改後的測試客戶')
    await page.getByLabel('Email').fill('updated@example.com')

    await page.getByRole('button', { name: '儲存' }).click()

    // 確認 PUT 傳送的資料
    expect(updatedCustomer).toEqual({
      name: '修改後的測試客戶',
      email: 'updated@example.com',
    })

    // 確認成功訊息及列表更新
    await expect(page.getByText('更新客戶成功。')).toBeVisible()

    await expect(page.getByText('修改後的測試客戶')).toBeVisible()

    await expect(page.getByText('updated@example.com')).toBeVisible()
  })

  test('管理員可以刪除客戶', async ({ page }) => {
    await prepareAdminPage(page)

    let customers = [...mockCustomers]
    let deletedCustomerId = null

    // 模擬取得客戶列表
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(customers),
        })
      }
    })

    // 模擬刪除客戶
    await page.route('http://localhost:5215/api/Customers/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedCustomerId = 1

        customers = customers.filter((customer) => customer.id !== 1)

        await route.fulfill({
          status: 204,
        })
      }
    })

    await page.goto('/customers')

    // 自動接受刪除確認視窗
    page.on('dialog', (dialog) => dialog.accept())

    await page.getByRole('button', { name: '刪除' }).first().click()

    // 確認確實送出刪除請求
    await expect.poll(() => deletedCustomerId).toBe(1)

    // 確認成功訊息
    await expect(page.getByText('已刪除客戶「測試客戶 A」。')).toBeVisible()

    // 確認被刪除的客戶不再出現在客戶列表
    await expect(page.locator('tbody').getByText('測試客戶 A')).toHaveCount(0)

    // 確認另一筆客戶仍然存在
    await expect(page.getByText('測試客戶 B')).toBeVisible()

    // 確認列表筆數已更新
    await expect(page.locator('.result-count')).toHaveText('共 1 筆客戶資料')
  })

  test('管理員可以取消刪除客戶', async ({ page }) => {
    await prepareAdminPage(page)

    let deleteRequestCount = 0

    // 模擬取得客戶列表
    await mockCustomerList(page)

    // 監控刪除請求
    await page.route('http://localhost:5215/api/Customers/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestCount++

        await route.fulfill({
          status: 204,
        })
      }
    })

    await page.goto('/customers')

    // 取消刪除確認視窗
    page.on('dialog', (dialog) => dialog.dismiss())

    await page.getByRole('button', { name: '刪除' }).first().click()

    // 確認刪除請求沒有送出
    expect(deleteRequestCount).toBe(0)

    // 確認客戶資料仍然存在
    await expect(page.locator('tbody').getByText('測試客戶 A')).toBeVisible()

    // 確認列表筆數沒有改變
    await expect(page.locator('.result-count')).toHaveText('共 2 筆客戶資料')
  })

  test('取得客戶資料失敗時應顯示錯誤訊息', async ({ page }) => {
    await prepareAuthenticatedPage(page)

    // 模擬取得客戶資料時發生伺服器錯誤
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal Server Error',
          }),
        })
      }
    })

    await page.goto('/customers')

    // 確認前端顯示預期的錯誤訊息
    await expect(page.getByText('無法取得客戶資料。')).toBeVisible()
  })

  test('新增客戶資料格式錯誤時應顯示錯誤訊息', async ({ page }) => {
    await prepareAdminPage(page)

    await mockCustomerList(page)

    // 模擬新增客戶時，後端回傳 HTTP 400
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Bad Request',
          }),
        })
      }
    })

    await page.goto('/customers')

    await page.getByRole('button', { name: '新增客戶' }).click()

    await page.getByLabel('客戶名稱').fill('格式錯誤測試')
    await page.getByLabel('Email').fill('valid-format@example.com')

    await page.getByRole('button', { name: '儲存' }).click()

    await expect(page.getByText('資料格式不正確，請檢查名稱與 Email。')).toBeVisible()
  })

  test('新增客戶時遇到 HTTP 401 應清除登入狀態並導向登入頁', async ({ page }) => {
    await prepareAdminPage(page)

    // 模擬客戶列表及新增客戶 API
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCustomers),
        })
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Unauthorized',
          }),
        })
      }
    })

    await page.goto('/customers')

    await page.getByRole('button', { name: '新增客戶' }).click()

    await page.getByLabel('客戶名稱').fill('401測試客戶')
    await page.getByLabel('Email').fill('test401@example.com')

    await page.getByRole('button', { name: '儲存' }).click()

    // 確認 HTTP 401 發生後導向登入頁
    await expect(page).toHaveURL(/\/login$/)

    // 確認登入資訊已經清除
    const authData = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      role: localStorage.getItem('role'),
    }))

    expect(authData).toEqual({
      token: null,
      role: null,
    })
  })

  test('管理員新增客戶時遇到 HTTP 403 應顯示權限不足訊息', async ({ page }) => {
    await prepareAdminPage(page)

    // 模擬客戶列表及新增客戶 API
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCustomers),
        })
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Forbidden',
          }),
        })
      }
    })

    await page.goto('/customers')

    // 開啟新增表單並填入資料
    await page.getByRole('button', { name: '新增客戶' }).click()

    await page.getByLabel('客戶名稱').fill('403測試客戶')
    await page.getByLabel('Email').fill('test403@example.com')

    await page.getByRole('button', { name: '儲存' }).click()

    // 確認頁面顯示權限不足訊息
    await expect(page.getByText('目前帳號沒有新增或修改客戶的權限。')).toBeVisible()

    // 確認仍停留在客戶管理頁面
    await expect(page).toHaveURL(/\/customers$/)
  })

  test('管理員編輯客戶時遇到 HTTP 404 應顯示找不到客戶訊息', async ({ page }) => {
    await prepareAdminPage(page)

    // 模擬客戶列表及更新客戶 API
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCustomers),
        })
      }
    })

    await page.route('http://localhost:5215/api/Customers/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Not Found',
          }),
        })
      }
    })

    await page.goto('/customers')

    // 編輯第一筆客戶
    await page.locator('tbody').getByRole('button', { name: '編輯' }).first().click()

    // 修改客戶資料並儲存
    await page.getByLabel('客戶名稱').fill('404測試客戶')
    await page.getByLabel('Email').fill('test404@example.com')

    await page.getByRole('button', { name: '儲存' }).click()

    // 確認頁面顯示找不到客戶的訊息
    await expect(page.getByText('找不到指定的客戶。')).toBeVisible()

    // 確認仍停留在客戶管理頁面
    await expect(page).toHaveURL(/\/customers$/)
  })

  test('管理員新增客戶時遇到 HTTP 500 應顯示一般錯誤訊息', async ({ page }) => {
    await prepareAdminPage(page)

    // 模擬客戶列表及新增客戶 API
    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCustomers),
        })
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal Server Error',
          }),
        })
      }
    })

    await page.goto('/customers')

    // 開啟新增表單並填入資料
    await page.getByRole('button', { name: '新增客戶' }).click()

    await page.getByLabel('客戶名稱').fill('500測試客戶')
    await page.getByLabel('Email').fill('test500@example.com')

    await page.getByRole('button', { name: '儲存' }).click()

    // 確認頁面顯示一般錯誤訊息
    await expect(page.getByText('儲存失敗，請確認後端 API。')).toBeVisible()

    // 確認仍停留在客戶管理頁面
    await expect(page).toHaveURL(/\/customers$/)
  })

  test('新增客戶時 Email 格式錯誤應阻止表單送出', async ({ page }) => {
    await prepareAdminPage(page)
    await mockCustomerList(page)

    // 監控是否真的送出新增客戶 API
    let postRequestCount = 0

    await page.route('http://localhost:5215/api/Customers', async (route) => {
      if (route.request().method() === 'POST') {
        postRequestCount++

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            name: 'Email驗證測試客戶',
            email: 'invalid-email',
          }),
        })
      }
    })

    await page.goto('/customers')

    // 開啟新增表單並填入資料
    await page.getByRole('button', { name: '新增客戶' }).click()

    await page.getByLabel('客戶名稱').fill('Email驗證測試客戶')

    const emailInput = page.getByLabel('Email')
    await emailInput.fill('invalid-email')

    // 確認瀏覽器判定 Email 格式不合法
    const isInvalidEmail = await emailInput.evaluate((element) => element.validity.typeMismatch)

    expect(isInvalidEmail).toBe(true)

    // 嘗試送出表單
    await page.getByRole('button', { name: '儲存' }).click()

    // 確認前端原生驗證阻止了 API 請求
    expect(postRequestCount).toBe(0)

    // 確認仍停留在客戶管理頁面
    await expect(page).toHaveURL(/\/customers$/)
  })
})
