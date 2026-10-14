import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const role = ref(localStorage.getItem('role'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'ADMIN')

  function login(loginToken, loginRole) {
    token.value = loginToken
    role.value = loginRole

    localStorage.setItem('token', loginToken)
    localStorage.setItem('role', loginRole)
  }

  function logout() {
    token.value = null
    role.value = null

    localStorage.removeItem('token')
    localStorage.removeItem('role')
  }

  return {
    token,
    role,
    isLoggedIn,
    isAdmin,
    login,
    logout
  }
})