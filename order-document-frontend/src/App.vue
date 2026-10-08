<script setup>
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'
import axios from 'axios'
import http from './api/http'

const username = ref('')
const password = ref('')
const message = ref('')
const authStore = useAuthStore()

const login = async () => {
  message.value = ''

  try {
    const response = await axios.post(
      'http://localhost:5215/api/Auth/login',
      {
        username: username.value,
        password: password.value
      }
    )

    // console.log('Login response:', response.data)
    authStore.login(response.data.token)

    console.log('登入成功')
    console.log('Token:', authStore.token)

    await testCustomers()

    message.value = '登入成功'
  } catch (error) {
    console.error('Login error:', error)

    message.value = '登入失敗'
  }
}

const testCustomers = async () => {
  try {
    const response = await http.get('/Customers')

    console.log('Customers:', response.data)
  } catch (error) {
    console.error('取得 Customers 失敗', error)
  }
}

</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>企業訂單管理系統</h1>

      <p class="subtitle">
        Order & Document Management System
      </p>

      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">帳號</label>

          <input id="username" v-model="username" type="text" placeholder="請輸入帳號" />
        </div>

        <div class="form-group">
          <label for="password">密碼</label>

          <input id="password" v-model="password" type="password" placeholder="請輸入密碼" />
        </div>

        <button type="submit">
          登入
        </button>

        <p v-if="message" class="message">
          {{ message }}
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  color: #333;
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

h1 {
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  margin-bottom: 30px;
  text-align: center;
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
}

input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #333;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}

.message {
  margin-top: 20px;
  text-align: center;
}
</style>