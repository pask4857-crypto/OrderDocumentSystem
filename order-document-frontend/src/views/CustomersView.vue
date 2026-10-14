<script setup>
import { onMounted, ref } from 'vue'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'

const customers = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const authStore = useAuthStore()

const showForm = ref(false)
const editingId = ref(null)

const form = ref({
    name: '',
    email: ''
})

const resetForm = () => {
    form.value = {
        name: '',
        email: ''
    }

    editingId.value = null
    showForm.value = false
    errorMessage.value = ''
    successMessage.value = ''
}

const loadCustomers = async () => {
    loading.value = true
    errorMessage.value = ''

    try {
        const response = await http.get('/Customers')
        customers.value = response.data
    } catch (error) {
        console.error('取得客戶資料失敗', error)
        errorMessage.value = '無法取得客戶資料。'
    } finally {
        loading.value = false
    }
}

const openCreateForm = () => {
    resetForm()
    showForm.value = true
}

const openEditForm = (customer) => {
    errorMessage.value = ''
    successMessage.value = ''

    editingId.value = customer.id
    form.value = {
        name: customer.name,
        email: customer.email
    }

    showForm.value = true
}

const saveCustomer = async () => {
    errorMessage.value = ''
    successMessage.value = ''

    saving.value = true

    try {
        if (editingId.value === null) {
            await http.post('/Customers', form.value)
            successMessage.value = '新增客戶成功。'
        } else {
            await http.put(
                `/Customers/${editingId.value}`,
                form.value
            )
            successMessage.value = '更新客戶成功。'
        }

        showForm.value = false
        editingId.value = null

        await loadCustomers()
    } catch (error) {
        console.error('儲存客戶失敗', error)

        if (error.response?.status === 400) {
            errorMessage.value = '資料格式不正確，請檢查名稱與 Email。'
        } else if (error.response?.status === 401) {
            errorMessage.value = '登入狀態已失效，請重新登入。'
        } else if (error.response?.status === 403) {
            errorMessage.value = '目前帳號沒有新增或修改客戶的權限。'
        } else if (error.response?.status === 404) {
            errorMessage.value = '找不到指定的客戶。'
        } else {
            errorMessage.value = '儲存失敗，請確認後端 API。'
        }
    } finally {
        saving.value = false
    }
}

const deleteCustomer = async (customer) => {
    const confirmed = window.confirm(
        `確定要刪除客戶「${customer.name}」嗎？`
    )

    if (!confirmed) {
        return
    }

    errorMessage.value = ''
    successMessage.value = ''

    try {
        await http.delete(`/Customers/${customer.id}`)

        successMessage.value = `已刪除客戶「${customer.name}」。`

        // 如果正在編輯這筆客戶，關閉表單
        if (editingId.value === customer.id) {
            resetForm()
        }

        await loadCustomers()
    } catch (error) {
        console.error('刪除客戶失敗', error)

        if (error.response?.status === 401) {
            errorMessage.value = '登入狀態已失效，請重新登入。'
        } else if (error.response?.status === 403) {
            errorMessage.value = '目前帳號沒有刪除客戶的權限。'
        } else if (error.response?.status === 404) {
            errorMessage.value = '找不到指定的客戶，可能已被刪除。'
        } else {
            errorMessage.value = '刪除失敗，請確認後端 API。'
        }
    }
}


onMounted(() => {
    loadCustomers()
})
</script>

<template>
    <section class="customers-page">
        <div class="page-header">
            <div>
                <h1>客戶管理</h1>
                <p>查看、新增與編輯系統中的客戶資料。</p>
            </div>

            <div class="header-actions">
                <button class="secondary-button" :disabled="loading" @click="loadCustomers">
                    重新載入
                </button>

                <button v-if="authStore.isAdmin" class="primary-button" @click="openCreateForm">
                    新增客戶
                </button>
            </div>
        </div>

        <div v-if="successMessage" class="message success">
            {{ successMessage }}
        </div>

        <div v-if="errorMessage && !showForm" class="message error">
            {{ errorMessage }}
        </div>

        <section v-if="showForm" class="form-card">
            <h2>
                {{ editingId === null ? '新增客戶' : '編輯客戶' }}
            </h2>

            <form @submit.prevent="saveCustomer">
                <div class="form-group">
                    <label for="customer-name">客戶名稱</label>
                    <input id="customer-name" v-model.trim="form.name" type="text" maxlength="100" required
                        placeholder="請輸入客戶名稱" />
                </div>

                <div class="form-group">
                    <label for="customer-email">Email</label>
                    <input id="customer-email" v-model.trim="form.email" type="email" maxlength="255" required
                        placeholder="請輸入 Email" />
                </div>

                <p v-if="errorMessage" class="form-error">
                    {{ errorMessage }}
                </p>

                <div class="form-actions">
                    <button class="primary-button" type="submit" :disabled="saving">
                        {{ saving ? '儲存中…' : '儲存' }}
                    </button>

                    <button class="secondary-button" type="button" :disabled="saving" @click="resetForm">
                        取消
                    </button>
                </div>
            </form>
        </section>

        <div class="table-card">
            <div v-if="loading" class="message">
                正在載入客戶資料……
            </div>

            <div v-else-if="customers.length === 0" class="message">
                目前沒有客戶資料。
            </div>

            <div v-else class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>客戶名稱</th>
                            <th>Email</th>
                            <th>操作</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="customer in customers" :key="customer.id">
                            <td>{{ customer.id }}</td>
                            <td>{{ customer.name }}</td>
                            <td>{{ customer.email }}</td>

                            <td>
                                <div v-if="authStore.isAdmin" class="row-actions">
                                    <button class="edit-button" @click="openEditForm(customer)">
                                        編輯
                                    </button>

                                    <button class="delete-button" @click="deleteCustomer(customer)">
                                        刪除
                                    </button>
                                </div>

                                <span v-else class="read-only-label">
                                    僅供檢視
                                </span>
                            </td>

                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <p class="result-count">
            共 {{ customers.length }} 筆客戶資料
        </p>
    </section>
</template>

<style scoped>
.customers-page {
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.page-header h1 {
    margin: 0 0 8px;
    color: #1e293b;
    font-size: 28px;
}

.page-header p {
    margin: 0;
    color: #64748b;
}

.header-actions,
.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.primary-button,
.secondary-button,
.edit-button {
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
}


.row-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.delete-button {
    padding: 7px 12px;
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fef2f2;
    color: #dc2626;
    font-size: 14px;
    cursor: pointer;
}

.delete-button:hover {
    background: #fee2e2;
}


.primary-button {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: white;
}

.primary-button:hover {
    background: #1d4ed8;
}

.secondary-button {
    border: 1px solid #cbd5e1;
    background: white;
    color: #475569;
}

.secondary-button:hover {
    background: #f8fafc;
}

.edit-button {
    padding: 7px 12px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
}

.primary-button:disabled,
.secondary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.form-card,
.table-card {
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    box-shadow: 0 3px 10px rgb(15 23 42 / 4%);
}

.form-card {
    padding: 24px;
}

.form-card h2 {
    margin: 0 0 22px;
    color: #1e293b;
    font-size: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 18px;
}

.form-group label {
    color: #475569;
    font-size: 14px;
    font-weight: 600;
}

.form-group input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    font: inherit;
}

.form-group input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
}

.form-actions {
    margin-top: 22px;
}

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

thead {
    background: #f1f5f9;
}

th,
td {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
}

th {
    color: #475569;
    font-size: 14px;
    font-weight: 600;
}

td {
    color: #334155;
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr:hover {
    background: #f8fafc;
}

.message {
    padding: 24px 20px;
    color: #64748b;
    text-align: center;
}

.message.success {
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    background: #f0fdf4;
    color: #15803d;
}

.message.error,
.form-error {
    color: #dc2626;
}

.form-error {
    margin: 0;
    font-size: 14px;
}

.result-count {
    margin: 0;
    color: #64748b;
    font-size: 14px;
}

.read-only-label {
    color: #64748b;
    font-size: 14px;
}

@media (max-width: 650px) {
    .page-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .header-actions {
        width: 100%;
    }

    .form-card {
        padding: 18px;
    }

    th,
    td {
        padding: 12px;
    }
}
</style>
