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
    return error.response?.data?.message || fallback
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

    try {
        const response = await http.get(
            `/Documents/orders/${orderId}`,
            {
                responseType: 'blob'
            }
        )

        const blobUrl = URL.createObjectURL(response.data)
        const link = document.createElement('a')

        link.href = blobUrl
        link.download = `Order_${orderId}.docx`

        document.body.appendChild(link)
        link.click()
        link.remove()

        URL.revokeObjectURL(blobUrl)
    } catch (error) {
        errorMessage.value = '下載 Word 訂單文件失敗。'
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
}

.page-header,
.details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

h1,
h2,
h3,
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
.list-section,
.details-section {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.form-section h2,
.list-section h2 {
    margin-bottom: 16px;
}

.order-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-field input,
.form-field select {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.item-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px auto;
    align-items: end;
    gap: 12px;
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
    font-size: 18px;
    font-weight: bold;
}

.hint {
    margin-bottom: 0;
    color: #666;
    font-size: 13px;
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
    opacity: 0.5;
    cursor: not-allowed;
}

.secondary-button {
    background: #6b7280;
}

.danger-button {
    background: #dc2626;
}

.remove-button {
    white-space: nowrap;
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
    white-space: nowrap;
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

.order-info {
    margin-bottom: 20px;
}

.order-info p {
    margin-bottom: 8px;
}

.status-actions {
    margin-top: 20px;
    align-items: center;
}

.status-actions h3 {
    width: 100%;
    margin-bottom: 0;
}

@media (max-width: 700px) {
    .page-header {
        align-items: flex-start;
    }

    .item-row {
        grid-template-columns: 1fr;
    }

    .action-cell {
        flex-wrap: wrap;
    }
}
</style>
