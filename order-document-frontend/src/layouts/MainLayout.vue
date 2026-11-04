<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const logout = () => {
    authStore.logout()
    router.push('/login')
}
</script>


<template>
    <div class="layout">
        <header class="navbar">
            <router-link to="/home" class="brand">
                <span class="brand-icon">◆</span>
                <span>企業訂單／文件管理系統</span>
            </router-link>

            <nav class="nav-links">
                <router-link to="/home" class="nav-link">
                    首頁
                </router-link>

                <router-link to="/customers" class="nav-link">
                    客戶管理
                </router-link>

                <router-link to="/products" class="nav-link">
                    商品管理
                </router-link>

                <router-link to="/orders" class="nav-link">
                    訂單管理
                </router-link>
            </nav>

            <div class="user-actions">
                <span class="user-role">
                    {{ authStore.role }}
                </span>

                <button class="logout-button" @click="logout">
                    登出
                </button>
            </div>
        </header>

        <main class="content">
            <router-view />
        </main>

        <footer class="footer">
            <span>企業訂單／文件管理系統</span>
            <span>Vue 3 + Vite</span>
        </footer>
    </div>
</template>



<style scoped>
.layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f7fb;
    color: #1e293b;
}

.navbar {
    display: flex;
    align-items: center;
    gap: 24px;
    min-height: 76px;
    padding: 12px 5%;
    background: #1e3a5f;
    color: white;
    box-shadow: 0 2px 8px rgb(15 23 42 / 12%);
}

.brand {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
    text-decoration: none;
    font-size: 20px;
    font-weight: 700;
    white-space: nowrap;
}

.brand-icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #3b82f6;
    font-size: 24px;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
}

.nav-link {
    display: block;
    padding: 11px 16px;
    border-radius: 8px;
    color: #dbeafe;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
    background: #2d5c91;
    color: white;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.user-role {
    padding: 6px 10px;
    border: 1px solid #8ba6c5;
    border-radius: 6px;
    color: #dbeafe;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.logout-button {
    padding: 10px 18px;
    border: 1px solid #8ba6c5;
    border-radius: 8px;
    background: transparent;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s;
}

.logout-button:hover {
    background: #315477;
}

.content {
    flex: 1;
    width: 100%;
    max-width: 1440px;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 36px 32px;
}

.footer {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 5%;
    border-top: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-size: 14px;
}

/* 平板與較窄的桌面畫面 */
@media (max-width: 900px) {
    .navbar {
        flex-wrap: wrap;
        gap: 16px;
        padding: 16px 5%;
    }

    .brand {
        font-size: 18px;
    }

    .nav-links {
        order: 3;
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
        margin: 0;
    }

    .content {
        padding: 24px 20px;
    }
}

/* 手機畫面 */
@media (max-width: 600px) {
    .navbar {
        gap: 14px;
        padding: 16px;
    }

    .brand {
        width: 100%;
        font-size: 17px;
        white-space: normal;
    }

    .user-actions {
        width: 100%;
        justify-content: space-between;
    }

    .nav-links {
        gap: 4px;
    }

    .nav-link {
        padding: 9px 10px;
        font-size: 14px;
    }

    .content {
        padding: 20px 14px;
    }

    .footer {
        flex-direction: column;
        gap: 6px;
        padding: 18px 16px;
    }
}
</style>
