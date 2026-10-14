<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const features = [
  {
    title: '客戶管理',
    description: '管理客戶資料，包含新增、編輯、刪除等功能。',
    link: '/customers',
    label: '前往客戶管理',
    icon: '♙',
    theme: 'blue'
  },
  {
    title: '商品管理',
    description: '管理商品資料，包含庫存、價格等資訊。',
    link: '/products',
    label: '前往商品管理',
    icon: '◇',
    theme: 'green'
  },
  {
    title: '訂單管理',
    description: '查看與管理訂單，包含訂單狀態、出貨等資訊。',
    link: '/orders',
    label: '前往訂單管理',
    icon: '▤',
    theme: 'orange'
  },
  {
    title: '文件管理',
    description: '產生與下載相關文件，例如訂單文件。',
    link: null,
    label: '即將推出',
    icon: '↓',
    theme: 'purple'
  }
]

const goTo = (path) => {
  if (path) {
    router.push(path)
  }
}
</script>

<template>
  <section class="dashboard">
    <header class="welcome-panel">
      <div>
        <h1>首頁 Dashboard</h1>
        <p>
          歡迎使用企業訂單／文件管理系統，
          您可以從上方選單進行各項管理作業。
        </p>
      </div>

      <div class="login-status">
        <span class="user-icon">♙</span>

        <div>
          <strong>目前已登入</strong>
          <p>歡迎使用本系統</p>
        </div>
      </div>
    </header>

    <div class="feature-grid">
      <article v-for="feature in features" :key="feature.title" class="feature-card" :class="feature.theme">
        <div class="feature-icon">
          {{ feature.icon }}
        </div>

        <h2>{{ feature.title }}</h2>

        <p class="feature-description">
          {{ feature.description }}
        </p>

        <button class="feature-link" :disabled="!feature.link" @click="goTo(feature.link)">
          {{ feature.label }}
          <span aria-hidden="true">→</span>
        </button>
      </article>
    </div>

    <section class="notice-panel">
      <div class="notice-icon">i</div>

      <div>
        <h2>系統公告</h2>
        <p>
          歡迎使用本系統！目前可以從導覽列進入各項管理功能。
        </p>
      </div>
    </section>
  </section>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.welcome-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px;
  border: 1px solid #e0eaf7;
  border-radius: 14px;
  background: linear-gradient(120deg, #fff, #edf5ff);
}

.welcome-panel h1 {
  margin: 0 0 12px;
  color: #172b4d;
  font-size: 30px;
}

.welcome-panel>div:first-child>p {
  margin: 0;
  color: #64748b;
  line-height: 1.8;
}

.login-status {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.user-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #dbeafe;
  color: #2563eb;
  font-size: 26px;
}

.login-status strong {
  color: #334155;
}

.login-status p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 280px;
  padding: 26px;
  border: 1px solid var(--card-border);
  border-radius: 14px;
  background: var(--card-background);
  box-shadow: 0 3px 10px rgb(15 23 42 / 3%);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
}

.feature-card.blue {
  --card-color: #2563eb;
  --card-border: #dbeafe;
  --card-background: #f8fbff;
}

.feature-card.green {
  --card-color: #059669;
  --card-border: #d1fae5;
  --card-background: #f7fdf9;
}

.feature-card.orange {
  --card-color: #ea580c;
  --card-border: #ffedd5;
  --card-background: #fffaf6;
}

.feature-card.purple {
  --card-color: #7c3aed;
  --card-border: #ede9fe;
  --card-background: #faf8ff;
}

.feature-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  border-radius: 50%;
  background: var(--card-color);
  color: white;
  font-size: 34px;
}

.feature-card h2 {
  margin: 0 0 12px;
  color: #1e293b;
  font-size: 22px;
}

.feature-description {
  margin: 0 0 24px;
  color: #64748b;
  line-height: 1.9;
}

.feature-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: auto;
  padding: 8px 0 0;
  border: none;
  background: transparent;
  color: var(--card-color);
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.feature-link span {
  font-size: 23px;
  transition: transform 0.2s;
}

.feature-link:not(:disabled):hover span {
  transform: translateX(4px);
}

.feature-link:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.notice-panel {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 24px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #f0f7ff;
}

.notice-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  font-size: 22px;
  font-weight: 700;
}

.notice-panel h2 {
  margin: 2px 0 8px;
  font-size: 18px;
}

.notice-panel p {
  margin: 0;
  color: #64748b;
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .welcome-panel {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }

  .welcome-panel h1 {
    font-size: 25px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    min-height: 240px;
  }

  .notice-panel {
    padding: 18px;
  }
}
</style>
