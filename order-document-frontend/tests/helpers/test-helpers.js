// 客戶管理測試使用的模擬資料
export const mockCustomers = [
  {
    id: 1,
    name: '測試客戶 A',
    email: 'customer-a@example.com',
  },
  {
    id: 2,
    name: '測試客戶 B',
    email: 'customer-b@example.com',
  },
]

// 商品管理測試使用的模擬資料
export const mockProducts = [
  {
    id: 1,
    name: '測試商品 A',
    price: 100,
    stock: 10,
  },
  {
    id: 2,
    name: '測試商品 B',
    price: 250,
    stock: 20,
  },
]

// 設定一般使用者登入狀態
export async function prepareAuthenticatedPage(page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('playwright-auth-initialized')) {
      localStorage.setItem('token', 'test-jwt-token')
      localStorage.setItem('role', 'USER')

      sessionStorage.setItem('playwright-auth-initialized', 'true')
    }
  })

  // 只攔截後端 API，避免連接真實資料庫
  await page.route('http://localhost:5215/api/**', async (route) => {
    await route.abort()
  })
}

// 設定管理員登入狀態
export async function prepareAdminPage(page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('playwright-auth-initialized')) {
      localStorage.setItem('token', 'test-jwt-token')
      localStorage.setItem('role', 'ADMIN')

      sessionStorage.setItem('playwright-auth-initialized', 'true')
    }
  })
}

// 模擬取得客戶列表
export async function mockCustomerList(page, customers = mockCustomers) {
  await page.route('http://localhost:5215/api/Customers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(customers),
    })
  })
}

// 模擬取得商品列表
export async function mockProductList(page, products = mockProducts) {
  await page.route('http://localhost:5215/api/Products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(products),
    })
  })
}
