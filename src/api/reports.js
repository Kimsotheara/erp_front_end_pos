import http from './http'

export const reportsApi = {
  dashboard: (companyId, branchId) =>
    http.get('/reports/dashboard', { params: { companyId, branchId } }),
  salesSummary: (companyId, from, to, branchId) =>
    http.get('/reports/sales-summary', { params: { companyId, from, to, branchId } }),
  profit: (companyId, from, to) =>
    http.get('/reports/profit', { params: { companyId, from, to } }),
  topProducts: (companyId, from, to, limit = 10) =>
    http.get('/reports/top-products', { params: { companyId, from, to, limit } }),
  lowStock: (companyId) => http.get('/reports/low-stock', { params: { companyId } }),
  expenseSummary: (companyId, from, to) =>
    http.get('/reports/expense-summary', { params: { companyId, from, to } }),
}
