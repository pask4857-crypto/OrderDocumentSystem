<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import http from '../api/http'

const authStore = useAuthStore()

const products = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isEditing = ref(false)
const editingId = ref(null)

const form = ref({
    name: '',
    price: 0,
    stock: 0
})

async function loadProducts() {
    loading.value = true
    errorMessage.value = ''

    try {
        const response = await http.get('/Products')
        products.value = response.data
    } catch (error) {
        const status = error.response?.status
        const serverMessage = error.response?.data?.message

        if (serverMessage) {
            errorMessage.value = serverMessage
        } else if (!error.response) {
            errorMessage.value =
                '無法連線至伺服器，請確認後端是否啟動。'
        } else if (status === 401) {
            errorMessage.value = '登入狀態已失效，請重新登入。'
        } else if (status === 403) {
            errorMessage.value = '你沒有權限查看商品。'
        } else if (status === 404) {
            errorMessage.value = '找不到商品資料。'
        } else if (status >= 500) {
            errorMessage.value = '伺服器發生錯誤，請稍後再試。'
        } else {
            errorMessage.value = '載入商品失敗，請稍後再試。'
        }
    } finally {
        loading.value = false
    }
}

function resetForm() {
    isEditing.value = false
    editingId.value = null

    form.value = {
        name: '',
        price: 0,
        stock: 0
    }
}

function editProduct(product) {
    isEditing.value = true
    editingId.value = product.id

    form.value = {
        name: product.name,
        price: product.price,
        stock: product.stock
    }

    errorMessage.value = ''
    successMessage.value = ''
}

async function saveProduct() {
    errorMessage.value = ''
    successMessage.value = ''

    if (!form.value.name.trim()) {
        errorMessage.value = '請輸入商品名稱。'
        return
    }

    if (
        !Number.isFinite(form.value.price) ||
        form.value.price < 0
    ) {
        errorMessage.value = '商品價格不可小於 0。'
        return
    }

    if (
        !Number.isInteger(form.value.stock) ||
        form.value.stock < 0
    ) {
        errorMessage.value = '庫存必須是大於或等於 0 的整數。'
        return
    }

    saving.value = true

    try {
        const requestData = {
            name: form.value.name.trim(),
            price: form.value.price,
            stock: form.value.stock
        }

        if (isEditing.value) {
            await http.put(`/Products/${editingId.value}`, requestData)
            successMessage.value = '商品更新成功。'
        } else {
            await http.post('/Products', requestData)
            successMessage.value = '商品新增成功。'
        }

        resetForm()
        await loadProducts()
    } catch (error) {
        const status = error.response?.status
        const serverMessage = error.response?.data?.message
        const action = isEditing.value ? '更新' : '新增'

        if (serverMessage) {
            errorMessage.value = serverMessage
        } else if (!error.response) {
            errorMessage.value =
                '無法連線至伺服器，請確認後端是否啟動。'
        } else if (status === 400) {
            errorMessage.value = '商品資料不正確，請檢查輸入內容。'
        } else if (status === 403) {
            errorMessage.value = '你沒有權限執行此操作。'
        } else if (status === 404) {
            errorMessage.value = '找不到指定的商品。'
        } else if (status >= 500) {
            errorMessage.value = '伺服器發生錯誤，請稍後再試。'
        } else {
            errorMessage.value = `商品${action}失敗，請稍後再試。`
        }
    } finally {
        saving.value = false
    }
}

async function deleteProduct(product) {
    const confirmed = window.confirm(
        `確定要刪除商品「${product.name}」嗎？`
    )

    if (!confirmed) {
        return
    }

    errorMessage.value = ''
    successMessage.value = ''

    try {
        await http.delete(`/Products/${product.id}`)

        if (editingId.value === product.id) {
            resetForm()
        }

        successMessage.value = '商品刪除成功。'
        await loadProducts()
    } catch (error) {
        const status = error.response?.status
        const serverMessage = error.response?.data?.message

        if (serverMessage) {
            // 優先顯示後端提供的錯誤訊息
            errorMessage.value = serverMessage
        } else if (!error.response) {
            // 沒有收到伺服器回應，通常是網路或連線問題
            errorMessage.value =
                '無法連線至伺服器，請確認後端是否啟動。'
        } else if (status === 400) {
            errorMessage.value = '請求資料不正確，請檢查輸入內容。'
        } else if (status === 403) {
            errorMessage.value = '你沒有權限刪除商品。'
        } else if (status === 404) {
            errorMessage.value = '找不到指定的商品。'
        } else if (status >= 500) {
            errorMessage.value = '伺服器發生錯誤，請稍後再試。'
        } else {
            errorMessage.value = '刪除商品失敗，請稍後再試。'
        }
    }
}

onMounted(() => {
    loadProducts()
})
</script>

<template>
    <section class="products-page">
        <div class="page-header">
            <div>
                <h1>商品管理</h1>
                <p>查看商品資訊與庫存狀態。</p>
            </div>

            <button type="button" @click="loadProducts">
                重新載入
            </button>
        </div>

        <p v-if="errorMessage" class="message error-message">
            {{ errorMessage }}
        </p>

        <p v-if="successMessage" class="message success-message">
            {{ successMessage }}
        </p>

        <section v-if="authStore.isAdmin" class="form-section">
            <h2>{{ isEditing ? '編輯商品' : '新增商品' }}</h2>

            <form class="product-form" @submit.prevent="saveProduct">
                <div class="form-field">
                    <label for="product-name">商品名稱</label>
                    <input id="product-name" v-model="form.name" type="text" maxlength="200" required />
                </div>

                <div class="form-field">
                    <label for="product-price">價格</label>
                    <input id="product-price" v-model.number="form.price" type="number" min="0" step="0.01" required />
                </div>

                <div class="form-field">
                    <label for="product-stock">庫存</label>
                    <input id="product-stock" v-model.number="form.stock" type="number" min="0" step="1" required />
                </div>

                <div class="form-actions">
                    <button type="submit" :disabled="saving">
                        {{
                            saving
                                ? '儲存中...'
                                : isEditing
                                    ? '儲存修改'
                                    : '新增商品'
                        }}
                    </button>

                    <button v-if="isEditing" type="button" class="secondary-button" @click="resetForm">
                        取消編輯
                    </button>
                </div>
            </form>
        </section>

        <section class="list-section">
            <h2>商品列表</h2>

            <p v-if="loading">正在載入商品...</p>

            <p v-else-if="products.length === 0">
                目前沒有商品資料。
            </p>

            <div v-else class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>商品名稱</th>
                            <th>價格</th>
                            <th>庫存</th>
                            <th v-if="authStore.isAdmin">操作</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="product in products" :key="product.id">
                            <td>{{ product.id }}</td>
                            <td>{{ product.name }}</td>
                            <td>{{ Number(product.price).toLocaleString() }}</td>
                            <td>{{ product.stock }}</td>

                            <td v-if="authStore.isAdmin" class="action-cell">
                                <button type="button" @click="editProduct(product)">
                                    編輯
                                </button>

                                <button type="button" class="danger-button" @click="deleteProduct(product)">
                                    刪除
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </section>
</template>

<style scoped>
.products-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

h1,
h2,
p {
    margin-top: 0;
}

h1 {
    margin-bottom: 8px;
}

.page-header p {
    margin-bottom: 0;
    color: #666;
}

.form-section,
.list-section {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.form-section h2,
.list-section h2 {
    margin-bottom: 16px;
}

.product-form {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-field input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.form-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 10px;
}

button {
    padding: 9px 14px;
    border: 0;
    border-radius: 4px;
    background: #2563eb;
    color: white;
    cursor: pointer;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.secondary-button {
    background: #6b7280;
}

.danger-button {
    background: #dc2626;
}

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    padding: 12px;
    border-bottom: 1px solid #ddd;
    text-align: left;
}

th {
    background: #f5f5f5;
}

.action-cell {
    display: flex;
    gap: 8px;
}

.message {
    margin-bottom: 0;
    padding: 12px;
    border-radius: 4px;
}

.error-message {
    background: #fef2f2;
    color: #b91c1c;
}

.success-message {
    background: #f0fdf4;
    color: #166534;
}

@media (max-width: 700px) {
    .product-form {
        grid-template-columns: 1fr;
    }

    .page-header {
        align-items: flex-start;
    }
}
</style>
