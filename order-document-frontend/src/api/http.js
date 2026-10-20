
import axios from 'axios'

const http = axios.create({
  baseURL: 'http://localhost:5215/api'
})

// Request Interceptor：發送請求前，自動附加 JWT
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Response Interceptor：統一處理 API 回應
http.interceptors.response.use(
  (response) => {
    // API 請求成功，直接回傳回應資料
    return response
  },
  (error) => {
    // 取得 HTTP 狀態碼
    const status = error.response?.status

    if (status === 401) {
      // 清除無效的登入資訊
      localStorage.removeItem('token')
      localStorage.removeItem('role')

      // 避免在登入頁上重複重新導向
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // 將錯誤繼續交給呼叫 API 的程式處理
    return Promise.reject(error)
  }
)

export default http
