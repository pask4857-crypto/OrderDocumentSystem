import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))

  const isLoggedIn = ref(!!token.value)

  function login(loginToken) {
    token.value = loginToken
    isLoggedIn.value = true

    localStorage.setItem('token', loginToken)
  }

  function logout() {
    token.value = null
    isLoggedIn.value = false

    localStorage.removeItem('token')
  }

  return {
    token,
    isLoggedIn,
    login,
    logout
  }
})