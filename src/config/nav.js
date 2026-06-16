// Sidebar structure. Each item maps to a route. `feature` gates by business type.
// `resource` items are rendered by the generic ResourcePage.
export const NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: 'grid' },
      { label: 'Point of Sale', to: '/pos', icon: 'cart' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Products', to: '/r/products', icon: 'box' },
      { label: 'Categories', to: '/r/categories', icon: 'tag' },
      { label: 'Brands', to: '/r/brands', icon: 'tag' },
      { label: 'Units', to: '/r/units', icon: 'ruler' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { label: 'Stock Operations', to: '/inventory', icon: 'layers' },
      { label: 'Warehouses', to: '/r/warehouses', icon: 'warehouse' },
      { label: 'Branch Transfers', to: '/branch-transfers', icon: 'truck' },
    ],
  },
  {
    group: 'Purchasing',
    items: [
      { label: 'Suppliers', to: '/r/suppliers', icon: 'users' },
      { label: 'Purchase Orders', to: '/purchase-orders', icon: 'clipboard' },
      { label: 'Goods Receipts', to: '/goods-receipts', icon: 'inbox' },
    ],
  },
  {
    group: 'Sales',
    items: [
      { label: 'Invoices', to: '/invoices', icon: 'receipt' },
      { label: 'Customers', to: '/r/customers', icon: 'users' },
      { label: 'Payment Methods', to: '/r/payment-methods', icon: 'card' },
      { label: 'Cash Drawers', to: '/cash-drawers', icon: 'cash' },
    ],
  },
  {
    group: 'Pharmacy',
    feature: 'pharmacy',
    items: [
      { label: 'Medicine Batches', to: '/medicine-batches', icon: 'pill' },
      { label: 'Manufacturers', to: '/r/manufacturers', icon: 'factory' },
      { label: 'Drug Categories', to: '/r/drug-categories', icon: 'tag' },
      { label: 'Prescriptions', to: '/r/prescriptions', icon: 'doc' },
    ],
  },
  {
    group: 'Restaurant',
    feature: 'pub',
    items: [
      { label: 'Dine-in Orders', to: '/dine-in', icon: 'receipt' },
      { label: 'Tables', to: '/r/tables', icon: 'table' },
      { label: 'Menu Items', to: '/r/menu-items', icon: 'menu' },
      { label: 'Reservations', to: '/r/reservations', icon: 'calendar' },
      { label: 'Kitchen Tickets', to: '/kitchen-tickets', icon: 'fire' },
    ],
  },
  {
    group: 'Staff',
    items: [
      { label: 'Shift Templates', to: '/r/shifts', icon: 'clock' },
      { label: 'Staff Roster', to: '/staff-shifts', icon: 'calendar' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { label: 'Expenses', to: '/r/expenses', icon: 'minus' },
      { label: 'Other Income', to: '/r/incomes', icon: 'plus' },
      { label: 'Reports', to: '/reports', icon: 'chart' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Companies', to: '/r/companies', icon: 'building' },
      { label: 'Branches', to: '/r/branches', icon: 'building' },
      { label: 'Currencies', to: '/r/currencies', icon: 'coin' },
      { label: 'Taxes', to: '/r/taxes', icon: 'percent' },
      { label: 'Users', to: '/r/users', icon: 'user' },
      { label: 'Roles', to: '/r/roles', icon: 'shield' },
      { label: 'Permissions', to: '/r/permissions', icon: 'key' },
    ],
  },
]
