<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loginMessage = ref('')

const login = async () => {
    try {
        const response = await axios.post(
            'http://localhost:5215/api/Auth/login',
            {
                username: username.value,
                password: password.value
            }
        )

        authStore.login(
            response.data.token,
            response.data.role
        )

        loginMessage.value = '登入成功'

        await router.push('/home')
    } catch (error) {
        loginMessage.value = '登入失敗'

        console.error('登入失敗', error)
    }
}
</script>

<template>
    <main>
        <h1>企業訂單／文件管理系統</h1>

        <h2>登入</h2>

        <form @submit.prevent="login">
            <div>
                <label>帳號：</label>
                <input v-model="username" type="text" />
            </div>

            <div>
                <label>密碼：</label>
                <input v-model="password" type="password" />
            </div>

            <button type="submit">登入</button>
        </form>

        <p>{{ loginMessage }}</p>
    </main>
</template>