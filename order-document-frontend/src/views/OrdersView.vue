<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import http from '../api/http'

const authStore = useAuthStore()

const orders = ref([])
const customers = ref([])
const products = ref([])

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const selectedOrder = ref(null)
const orderDetailsLoading = ref(false)

const form = ref({
    customerId: '',
    items: [
        {
            productId: '',
            quantity: 1
        }
    ]
})

const selectedTotal = computed(() => {
    return form.value.items.reduce((total, item) => {
        const product = products.value.find(
            p => p.id === Number(item.productId)
        )

        if (!product) {
            return total
        }

        return total + Number(product.price) * Number(item.quantity)
    }, 0)
})

function formatDate(value) {
    return new Date(value).toLocaleString('zh-TW')
}

function formatAmount(value) {
    return Number(value ?? 0).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })
}

function getErrorMessage(error, fallback) {
    const status = error.response?.status
    const serverMessage = error.response?.data?.message

    if (serverMessage) {
        return serverMessage
    }

    if (!error.response) {
        return '無法連線至伺服器，請確認後端是否啟動。'
    }

    if (status === 400) {
        return '提交的資料不正確，請檢查輸入內容。'
    }

    if (status === 401) {
        return '登入狀態已失效，請重新登入。'
    }

    if (status === 403) {
        return '你沒有權限執行此操作。'
    }

    if (status === 404) {
        return '找不到指定的資料。'
    }

    if (status >= 500) {
        return '伺服器發生錯誤，請稍後再試。'
    }

    return fallback
}

async function loadOrders() {
    loading.value = true
    errorMessage.value = ''

    try {
        const response = await http.get('/Orders')
        orders.value = response.data
    } catch (error) {
        errorMessage.value = getErrorMessage(
            error,
            '載入訂單失敗，請稍後再試。'
        )
    } finally {
        loading.value = false
    }
}

async function loadCustomers() {
    try {
        const response = await http.get('/Customers')
        customers.value = response.data
    } catch (error) {
        errorMessage.value = getErrorMessage(
            error,
            '載入客戶資料失敗。'
        )
    }
}

async function loadProducts() {
    try {
        const response = await http.get('/Products')
        products.value = response.data
    } catch (error) {
        errorMessage.value = getErrorMessage(
            error,
            '載入商品資料失敗。'
        )
    }
}

function addItem() {
    form.value.items.push({
        productId: '',
        quantity: 1
    })
}

function removeItem(index) {
    if (form.value.items.length === 1) {
        return
    }

    form.value.items.splice(index, 1)
}

function resetForm() {
    form.value = {
        customerId: '',
        items: [
            {
                productId: '',
                quantity: 1
            }
        ]
    }
}

async function createOrder() {
    errorMessage.value = ''
    successMessage.value = ''

    if (!form.value.customerId) {
        errorMessage.value = '請選擇客戶。'
        return
    }

    const hasInvalidItem = form.value.items.some(item => {
        return (
            !item.productId ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) < 1
        )
    })

    if (hasInvalidItem) {
        errorMessage.value = '請確認每項商品都已選擇，且數量至少為 1。'
        return
    }

    const productIds = form.value.items.map(
        item => Number(item.productId)
    )

    if (new Set(productIds).size !== productIds.length) {
        errorMessage.value = '同一商品請只新增一列，並調整該列數量。'
        return
    }

    saving.value = true

    try {
        const requestData = {
            customerId: Number(form.value.customerId),
            items: form.value.items.map(item => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity)
            }))
        }

        await http.post('/Orders', requestData)

        successMessage.value = '訂單建立成功。'
        resetForm()

        await Promise.all([
            loadOrders(),
            loadProducts()
        ])
    } catch (error) {
        errorMessage.value = getErrorMessage(
            error,
            '建立訂單失敗，請確認客戶、商品與庫存資料。'
        )
    } finally {
        saving.value = false
    }
}

async function viewOrder(orderId) {
    errorMessage.value = ''
    selectedOrder.value = null
    orderDetailsLoading.value = true

    try {
        const response = await http.get(`/Orders/${orderId}`)
        selectedOrder.value = response.data
    } catch (error) {
        errorMessage.value = getErrorMessage(
            error,
            '載入訂單明細失敗。'
        )
    } finally {
        orderDetailsLoading.value = false
    }
}

function closeOrderDetails() {
    selectedOrder.value = null
}

function getAvailableStatuses(status) {
    if (status === 'Pending') {
        return ['Confirmed', 'Cancelled']
    }

    if (status === 'Confirmed') {
        return ['Completed', 'Cancelled']
    }

    return []
}

async function updateOrderStatus(order, newStatus) {
    if (!newStatus || newStatus === order.status) {
        return
    }

    errorMessage.value = ''
    successMessage.value = ''

    try {
        await http.patch(`/Orders/${order.id}/status`, {
            status: newStatus
        })

        successMessage.value = `訂單 #${order.id} 狀態已更新。`

        await loadOrders()

        if (selectedOrder.value?.id === order.id) {
            await viewOrder(order.id)
        }

        await loadProducts()
    } catch (error) {
        errorMessage.value = getErrorMessage(
            error,
            '更新訂單狀態失敗。'
        )
    }
}

async function downloadOrderDocument(orderId) {
    errorMessage.value = ''
    successMessage.value = ''
    let blobUrl

    try {
        const response = await http.get(
            `/Documents/orders/${orderId}`,
            {
                responseType: 'blob'
            }
        )

        blobUrl = URL.createObjectURL(response.data)

        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `Order_${orderId}.docx`

        document.body.appendChild(link)
        link.click()
        link.remove()
    } catch (error) {
        const fallback = '下載 Word 訂單文件失敗。'
        const errorData = error.response?.data

        if (errorData instanceof Blob) {
            try {
                const text = await errorData.text()
                const data = JSON.parse(text)

                errorMessage.value =
                    data.message || getErrorMessage(error, fallback)
            } catch {
                errorMessage.value = getErrorMessage(error, fallback)
            }
        } else {
            errorMessage.value = getErrorMessage(error, fallback)
        }
    } finally {
        if (blobUrl) {
            window.setTimeout(() => {
                URL.revokeObjectURL(blobUrl)
            }, 1000)
        }
    }
}

onMounted(async () => {
    await Promise.all([
        loadOrders(),
        loadCustomers(),
        loadProducts()
    ])
})
</script>

<template>
    <section class="orders-page">
        <div class="page-header">
            <div>
                <h1>訂單管理</h1>
                <p>建立訂單、查看訂單明細及管理訂單狀態。</p>
            </div>

            <button type="button" @click="loadOrders">
                重新載入
            </button>
        </div>

        <p v-if="errorMessage" class="message error-message">
            {{ errorMessage }}
        </p>

        <p v-if="successMessage" class="message success-message">
            {{ successMessage }}
        </p>

        <section class="form-section">
            <h2>建立訂單</h2>

            <form class="order-form" @submit.prevent="createOrder">
                <div class="form-field">
                    <label for="customer">客戶</label>

                    <select id="customer" v-model="form.customerId" required>
                        <option value="" disabled>請選擇客戶</option>

                        <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                            {{ customer.name }}（{{ customer.email }}）
                        </option>
                    </select>
                </div>

                <h3>訂單商品</h3>

                <div v-for="(item, index) in form.items" :key="index" class="item-row">
                    <div class="form-field product-field">
                        <label :for="`product-${index}`">商品</label>

                        <select :id="`product-${index}`" v-model="item.productId" required>
                            <option value="" disabled>請選擇商品</option>

                            <option v-for="product in products" :key="product.id" :value="product.id" :disabled="product.stock <= 0 ||
                                form.items.some(
                                    (other, otherIndex) =>
                                        otherIndex !== index &&
                                        Number(other.productId) === product.id
                                )
                                ">
                                {{ product.name }}｜
                                ${{ formatAmount(product.price) }}｜
                                庫存 {{ product.stock }}
                            </option>
                        </select>
                    </div>

                    <div class="form-field quantity-field">
                        <label :for="`quantity-${index}`">數量</label>

                        <input :id="`quantity-${index}`" v-model.number="item.quantity" type="number" min="1" step="1"
                            required />
                    </div>

                    <button type="button" class="danger-button remove-button" :disabled="form.items.length === 1"
                        @click="removeItem(index)">
                        移除此列
                    </button>
                </div>

                <div class="item-actions">
                    <button type="button" class="secondary-button" @click="addItem">
                        新增商品列
                    </button>
                </div>

                <p class="total-preview">
                    預估金額：${{ formatAmount(selectedTotal) }}
                </p>

                <p class="hint">
                    預估金額僅供參考，實際金額與庫存以後端處理結果為準。
                </p>

                <div class="form-actions">
                    <button type="submit" :disabled="saving">
                        {{ saving ? '建立中...' : '建立訂單' }}
                    </button>

                    <button type="button" class="secondary-button" @click="resetForm">
                        清空表單
                    </button>
                </div>
            </form>
        </section>

        <section class="list-section">
            <h2>訂單列表</h2>

            <p v-if="loading">正在載入訂單...</p>

            <p v-else-if="orders.length === 0">
                目前沒有訂單資料。
            </p>

            <div v-else class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>訂單編號</th>
                            <th>客戶</th>
                            <th>訂單日期</th>
                            <th>狀態</th>
                            <th>總金額</th>
                            <th>操作</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="order in orders" :key="order.id">
                            <td>#{{ order.id }}</td>
                            <td>{{ order.customerName }}</td>
                            <td>{{ formatDate(order.orderDate) }}</td>
                            <td>{{ order.status }}</td>
                            <td>${{ formatAmount(order.totalAmount) }}</td>

                            <td class="action-cell">
                                <button type="button" @click="viewOrder(order.id)">
                                    查看明細
                                </button>

                                <button type="button" class="secondary-button" @click="downloadOrderDocument(order.id)">
                                    下載 Word
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section v-if="orderDetailsLoading" class="details-section">
            正在載入訂單明細...
        </section>

        <section v-if="selectedOrder" class="details-section">
            <div class="details-header">
                <h2>訂單 #{{ selectedOrder.id }} 明細</h2>

                <button type="button" class="secondary-button" @click="closeOrderDetails">
                    關閉
                </button>
            </div>

            <div class="order-info">
                <p><strong>客戶：</strong>{{ selectedOrder.customerName }}</p>
                <p><strong>Email：</strong>{{ selectedOrder.customerEmail }}</p>
                <p>
                    <strong>訂單日期：</strong>
                    {{ formatDate(selectedOrder.orderDate) }}
                </p>
                <p><strong>狀態：</strong>{{ selectedOrder.status }}</p>
                <p>
                    <strong>總金額：</strong>
                    ${{ formatAmount(selectedOrder.totalAmount) }}
                </p>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>商品</th>
                            <th>單價</th>
                            <th>數量</th>
                            <th>小計</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="item in selectedOrder.items" :key="item.id">
                            <td>{{ item.productName }}</td>
                            <td>${{ formatAmount(item.unitPrice) }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>${{ formatAmount(item.subtotal) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="authStore.isAdmin &&
                getAvailableStatuses(selectedOrder.status).length > 0" class="status-actions">
                <h3>更新訂單狀態</h3>

                <button v-for="status in getAvailableStatuses(selectedOrder.status)" :key="status" type="button"
                    :class="{ 'danger-button': status === 'Cancelled' }"
                    @click="updateOrderStatus(selectedOrder, status)">
                    {{
                        status === 'Confirmed'
                            ? '確認訂單'
                            : status === 'Completed'
                                ? '完成訂單'
                                : '取消訂單'
                    }}
                </button>
            </div>
        </section>
    </section>
</template>


<style scoped>
.orders-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
}

.page-header,
.details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    min-width: 0;
}

.page-header>div,
.details-header>h2 {
    min-width: 0;
}

h1,
h2,
h3,
p {
    margin-top: 0;
}

h1 {
    margin-bottom: 8px;
    color: #1e293b;
    font-size: 28px;
    line-height: 1.4;
}

.page-header p {
    margin-bottom: 0;
    color: #64748b;
}

.form-section,
.list-section,
.details-section {
    min-width: 0;
    padding: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    box-shadow: 0 3px 10px rgb(15 23 42 / 4%);
}

.form-section h2,
.list-section h2 {
    margin-bottom: 16px;
    color: #1e293b;
    font-size: 20px;
}

.order-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.form-field label {
    color: #475569;
    font-size: 14px;
    font-weight: 600;
}

.form-field input,
.form-field select {
    width: 100%;
    min-width: 0;
    padding: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
}

.form-field input:focus,
.form-field select:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
}

.item-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px auto;
    align-items: end;
    gap: 12px;
    min-width: 0;
}

.item-actions,
.form-actions,
.status-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.total-preview {
    margin-bottom: 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: bold;
}

.hint {
    margin-bottom: 0;
    color: #64748b;
    font-size: 13px;
    overflow-wrap: anywhere;
}

button {
    min-height: 40px;
    padding: 9px 14px;
    border: 0;
    border-radius: 8px;
    background: #2563eb;
    color: white;
    font-size: 14px;
    cursor: pointer;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

button:focus-visible {
    outline: 3px solid rgb(59 130 246 / 35%);
    outline-offset: 2px;
}

.secondary-button {
    background: #64748b;
}

.danger-button {
    background: #dc2626;
}

.remove-button {
    white-space: nowrap;
}

.table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.list-section table {
    min-width: 760px;
}

.details-section table {
    min-width: 520px;
}

th,
td {
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
    white-space: nowrap;
}

th {
    background: #f1f5f9;
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

.action-cell {
    white-space: nowrap;
}

.action-cell button+button {
    margin-left: 8px;
}

.message {
    margin-bottom: 0;
    padding: 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    line-height: 1.6;
    overflow-wrap: anywhere;
}

.error-message {
    border-color: #fecaca;
    background: #fef2f2;
    color: #b91c1c;
}

.success-message {
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #166534;
}

.order-info {
    margin-bottom: 20px;
    min-width: 0;
}

.order-info p {
    margin-bottom: 8px;
    overflow-wrap: anywhere;
}

.status-actions {
    margin-top: 20px;
    align-items: center;
}

.status-actions h3 {
    width: 100%;
    margin-bottom: 0;
}

/* 支援滑鼠的裝置才顯示 hover 效果 */
@media (hover: hover) and (pointer: fine) {
    button:not(:disabled):hover {
        filter: brightness(0.93);
    }
}

/* 平板與較窄的桌面畫面 */
@media (max-width: 900px) {
    .item-row {
        grid-template-columns: minmax(0, 1fr) 110px;
    }

    .remove-button {
        grid-column: 1 / -1;
        justify-self: start;
    }
}

/* 手機畫面 */
@media (max-width: 700px) {
    .orders-page {
        gap: 18px;
    }

    .page-header,
    .details-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .page-header h1 {
        font-size: 25px;
    }

    .page-header>button,
    .details-header>button {
        width: 100%;
    }

    .form-section,
    .list-section,
    .details-section {
        padding: 16px;
    }

    .item-row {
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
    }

    .remove-button {
        grid-column: auto;
        justify-self: stretch;
        width: 100%;
    }

    .item-actions button {
        width: 100%;
    }

    .form-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .form-actions button {
        width: 100%;
        padding: 9px 8px;
    }

    .status-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .status-actions h3 {
        grid-column: 1 / -1;
    }

    .status-actions button {
        width: 100%;
        padding: 9px 8px;
    }

    th,
    td {
        padding: 11px 12px;
    }

    .action-cell button+button {
        margin-left: 4px;
    }
}

/* 減少動態效果的使用者偏好 */
@media (prefers-reduced-motion: reduce) {
    * {
        scroll-behavior: auto;
    }
}
</style>
