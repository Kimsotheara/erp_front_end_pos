import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'pos', name: 'pos', component: () => import('@/views/pos/Checkout.vue') },
      { path: 'inventory', name: 'inventory', component: () => import('@/views/inventory/Inventory.vue') },
      { path: 'invoices', name: 'invoices', component: () => import('@/views/sales/Invoices.vue') },
      { path: 'reports', name: 'reports', component: () => import('@/views/Reports.vue') },
      { path: 'purchase-orders', name: 'purchase-orders', component: () => import('@/views/purchasing/PurchaseOrders.vue') },
      { path: 'goods-receipts', name: 'goods-receipts', component: () => import('@/views/purchasing/GoodsReceipts.vue') },
      { path: 'branch-transfers', name: 'branch-transfers', component: () => import('@/views/inventory/BranchTransfers.vue') },
      { path: 'cash-drawers', name: 'cash-drawers', component: () => import('@/views/finance/CashDrawers.vue') },
      { path: 'staff-shifts', name: 'staff-shifts', component: () => import('@/views/staff/StaffShifts.vue') },
      { path: 'dine-in', name: 'dine-in', component: () => import('@/views/restaurant/DineInOrders.vue') },
      { path: 'kitchen-tickets', name: 'kitchen-tickets', component: () => import('@/views/restaurant/KitchenTickets.vue') },
      { path: 'medicine-batches', name: 'medicine-batches', component: () => import('@/views/pharmacy/MedicineBatches.vue') },
      { path: 'r/:resourceKey', name: 'resource', component: () => import('@/views/ResourceView.vue'), props: true },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
