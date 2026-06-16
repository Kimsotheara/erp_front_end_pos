// Declarative definitions for every CRUD resource. The generic ResourcePage
// renders a list + create/edit form from this config, so adding a screen is
// just adding an entry here.
//
// field.type: text | textarea | number | money | checkbox | select | ref |
//             multiref | date | datetime | time | password
// field.ref:  { resource, labelKey, valueKey, companyScoped }
// companyScoped on a resource => companyId is auto-injected from the active company.

import { BUSINESS_TYPES } from './modules'

const ACTIVE = { key: 'isActive', label: 'Active', type: 'checkbox', default: true }
const IMAGE = { key: 'image', label: 'Image URL', type: 'text', hint: 'Optional image URL.' }

export const RESOURCES = {
  // ---------------- Organization ----------------
  companies: {
    path: '/companies',
    title: 'Companies',
    singular: 'Company',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'businessType', label: 'Type', type: 'badge' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'legalName', label: 'Legal name', type: 'text' },
      { key: 'businessType', label: 'Business type', type: 'select', required: true, options: BUSINESS_TYPES.map((v) => ({ value: v, label: v })) },
      { key: 'taxNumber', label: 'Tax number', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'logoUrl', label: 'Logo URL', type: 'text' },
      IMAGE,
      ACTIVE,
    ],
  },
  branches: {
    path: '/branches',
    title: 'Branches',
    singular: 'Branch',
    companyScoped: true,
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'currencyId', label: 'Currency', type: 'ref', ref: { resource: 'currencies', labelKey: 'name' } },
      ACTIVE,
    ],
  },
  currencies: {
    path: '/currencies',
    title: 'Currencies',
    singular: 'Currency',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'symbol', label: 'Symbol' },
      { key: 'exchangeRate', label: 'Rate' },
      { key: 'isBase', label: 'Base', type: 'bool' },
    ],
    fields: [
      { key: 'code', label: 'Code (3-letter)', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'symbol', label: 'Symbol', type: 'text' },
      { key: 'exchangeRate', label: 'Exchange rate', type: 'number' },
      { key: 'isBase', label: 'Base currency', type: 'checkbox' },
      ACTIVE,
    ],
  },
  taxes: {
    path: '/taxes',
    title: 'Taxes',
    singular: 'Tax',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'rate', label: 'Rate %' },
      { key: 'isInclusive', label: 'Inclusive', type: 'bool' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'rate', label: 'Rate (%)', type: 'number', required: true },
      { key: 'isInclusive', label: 'Tax inclusive', type: 'checkbox' },
      ACTIVE,
    ],
  },

  // ---------------- Product ----------------
  products: {
    path: '/products',
    title: 'Products',
    singular: 'Product',
    companyScoped: true,
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'barcode', label: 'Barcode' },
      { key: 'costPrice', label: 'Cost', type: 'money' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'sku', label: 'SKU', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'barcode', label: 'Barcode', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'categoryId', label: 'Category', type: 'ref', ref: { resource: 'categories', labelKey: 'name', companyScoped: true } },
      { key: 'brandId', label: 'Brand', type: 'ref', ref: { resource: 'brands', labelKey: 'name', companyScoped: true } },
      { key: 'unitId', label: 'Unit', type: 'ref', ref: { resource: 'units', labelKey: 'name', companyScoped: true } },
      { key: 'taxId', label: 'Tax', type: 'ref', ref: { resource: 'taxes', labelKey: 'name', companyScoped: true } },
      { key: 'costPrice', label: 'Cost price', type: 'money' },
      { key: 'reorderLevel', label: 'Reorder level', type: 'number' },
      { key: 'isService', label: 'Service (no stock)', type: 'checkbox' },
      { key: 'trackStock', label: 'Track stock', type: 'checkbox', default: true },
      IMAGE,
      ACTIVE,
    ],
  },
  categories: {
    path: '/categories',
    title: 'Categories',
    singular: 'Category',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'parentId', label: 'Parent category', type: 'ref', ref: { resource: 'categories', labelKey: 'name', companyScoped: true } },
      IMAGE,
      ACTIVE,
    ],
  },
  brands: {
    path: '/brands',
    title: 'Brands',
    singular: 'Brand',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      IMAGE,
      ACTIVE,
    ],
  },
  units: {
    path: '/units',
    title: 'Units',
    singular: 'Unit',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'abbreviation', label: 'Abbr.' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'abbreviation', label: 'Abbreviation', type: 'text' },
      ACTIVE,
    ],
  },

  // ---------------- Inventory ----------------
  warehouses: {
    path: '/warehouses',
    title: 'Warehouses',
    singular: 'Warehouse',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'isDefault', label: 'Default', type: 'bool' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'branchId', label: 'Branch', type: 'ref', required: true, ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'isDefault', label: 'Default warehouse', type: 'checkbox' },
      ACTIVE,
    ],
  },

  // ---------------- Partners ----------------
  suppliers: {
    path: '/suppliers',
    title: 'Suppliers',
    singular: 'Supplier',
    companyScoped: true,
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'taxNumber', label: 'Tax number', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      IMAGE,
      { key: 'contacts', label: 'Contacts', type: 'subform', itemLabel: 'contact', itemFields: [
        { key: 'name', label: 'Name' },
        { key: 'position', label: 'Position' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
      ] },
      ACTIVE,
    ],
  },
  customers: {
    path: '/customers',
    title: 'Customers',
    singular: 'Customer',
    companyScoped: true,
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'membershipTier', label: 'Tier' },
      { key: 'loyaltyBalance', label: 'Points' },
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'membershipNo', label: 'Membership no.', type: 'text' },
      { key: 'membershipTier', label: 'Membership tier', type: 'text' },
      { key: 'loyaltyBalance', label: 'Loyalty balance', type: 'number' },
      IMAGE,
      ACTIVE,
    ],
  },

  // ---------------- Sales config ----------------
  'payment-methods': {
    path: '/payment-methods',
    title: 'Payment Methods',
    singular: 'Payment Method',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'isCash', label: 'Cash', type: 'bool' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'isCash', label: 'Cash tender', type: 'checkbox' },
      ACTIVE,
    ],
  },

  // ---------------- Finance ----------------
  expenses: {
    path: '/expenses',
    title: 'Expenses',
    singular: 'Expense',
    companyScoped: true,
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount', type: 'money' },
      { key: 'expenseDate', label: 'Date' },
      { key: 'description', label: 'Description' },
    ],
    fields: [
      { key: 'branchId', label: 'Branch', type: 'ref', ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'money', required: true },
      { key: 'expenseDate', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  incomes: {
    path: '/incomes',
    title: 'Other Income',
    singular: 'Income',
    companyScoped: true,
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount', type: 'money' },
      { key: 'incomeDate', label: 'Date' },
      { key: 'description', label: 'Description' },
    ],
    fields: [
      { key: 'branchId', label: 'Branch', type: 'ref', ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'money', required: true },
      { key: 'incomeDate', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  // ---------------- Security ----------------
  users: {
    path: '/users',
    title: 'Users',
    singular: 'User',
    companyScoped: true,
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'fullName', label: 'Full name' },
      { key: 'email', label: 'Email' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'fullName', label: 'Full name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'password', label: 'Password', type: 'password', hint: 'Leave blank to keep current password when editing.' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'defaultBranchId', label: 'Default branch', type: 'ref', ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      { key: 'roleIds', label: 'Roles', type: 'multiref', ref: { resource: 'roles', labelKey: 'name', companyScoped: true } },
      { key: 'branchIds', label: 'Branch access', type: 'multiref', ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      IMAGE,
      ACTIVE,
    ],
  },
  roles: {
    path: '/roles',
    title: 'Roles',
    singular: 'Role',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'isSystem', label: 'System', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'permissionIds', label: 'Permissions', type: 'multiref', ref: { resource: 'permissions', labelKey: 'code' } },
    ],
  },
  permissions: {
    path: '/permissions',
    title: 'Permissions',
    singular: 'Permission',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'description', label: 'Description' },
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  // ---------------- Pharmacy ----------------
  manufacturers: {
    path: '/manufacturers',
    title: 'Manufacturers',
    singular: 'Manufacturer',
    feature: 'pharmacy',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'country', label: 'Country' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text' },
      ACTIVE,
    ],
  },
  'drug-categories': {
    path: '/drug-categories',
    title: 'Drug Categories',
    singular: 'Drug Category',
    feature: 'pharmacy',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'requiresPrescription', label: 'Rx required', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'requiresPrescription', label: 'Requires prescription', type: 'checkbox' },
    ],
  },
  prescriptions: {
    path: '/prescriptions',
    title: 'Prescriptions',
    singular: 'Prescription',
    feature: 'pharmacy',
    columns: [
      { key: 'doctorName', label: 'Doctor' },
      { key: 'doctorLicense', label: 'License' },
      { key: 'issuedDate', label: 'Issued' },
    ],
    fields: [
      { key: 'customerId', label: 'Customer', type: 'ref', ref: { resource: 'customers', labelKey: 'name', companyScoped: true } },
      { key: 'invoiceId', label: 'Invoice #', type: 'number', hint: 'Optional sales invoice to link.' },
      { key: 'doctorName', label: 'Doctor name', type: 'text' },
      { key: 'doctorLicense', label: 'Doctor license', type: 'text' },
      { key: 'issuedDate', label: 'Issued date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ---------------- Pub / Restaurant ----------------
  tables: {
    path: '/tables',
    title: 'Tables',
    singular: 'Table',
    feature: 'pub',
    // Renders the status column as an inline dropdown that PATCHes /tables/{id}/status.
    inlineStatus: { key: 'status', path: '/tables', options: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] },
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'capacity', label: 'Seats' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    fields: [
      { key: 'branchId', label: 'Branch', type: 'ref', required: true, ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'].map((v) => ({ value: v, label: v })) },
    ],
  },
  'menu-items': {
    path: '/menu-items',
    title: 'Menu Items',
    singular: 'Menu Item',
    feature: 'pub',
    companyScoped: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price', type: 'money' },
      { key: 'happyHourPrice', label: 'Happy hr', type: 'money' },
      { key: 'isAvailable', label: 'Available', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'productId', label: 'Linked product', type: 'ref', ref: { resource: 'products', labelKey: 'name', companyScoped: true } },
      { key: 'category', label: 'Menu category', type: 'text' },
      { key: 'price', label: 'Price', type: 'money', required: true },
      { key: 'happyHourPrice', label: 'Happy-hour price', type: 'money' },
      IMAGE,
      { key: 'isAvailable', label: 'Available', type: 'checkbox', default: true },
    ],
  },
  reservations: {
    path: '/reservations',
    title: 'Reservations',
    singular: 'Reservation',
    feature: 'pub',
    columns: [
      { key: 'customerName', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'partySize', label: 'Party' },
      { key: 'reservedFrom', label: 'From', type: 'datetime' },
    ],
    fields: [
      { key: 'tableId', label: 'Table', type: 'ref', required: true, ref: { resource: 'tables', labelKey: 'name' } },
      { key: 'customerId', label: 'Customer (member)', type: 'ref', ref: { resource: 'customers', labelKey: 'name', companyScoped: true } },
      { key: 'customerName', label: 'Customer name', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'partySize', label: 'Party size', type: 'number' },
      { key: 'reservedFrom', label: 'Reserved from', type: 'datetime', required: true },
      { key: 'reservedTo', label: 'Reserved to', type: 'datetime' },
      { key: 'note', label: 'Note', type: 'textarea' },
    ],
  },

  // ---------------- Staff ----------------
  shifts: {
    path: '/shifts',
    title: 'Shift Templates',
    singular: 'Shift',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'startTime', label: 'Start', type: 'time' },
      { key: 'endTime', label: 'End', type: 'time' },
      { key: 'breakMinutes', label: 'Break (min)' },
    ],
    fields: [
      { key: 'branchId', label: 'Branch', type: 'ref', required: true, ref: { resource: 'branches', labelKey: 'name', companyScoped: true } },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'startTime', label: 'Start time', type: 'time', required: true },
      { key: 'endTime', label: 'End time', type: 'time', required: true },
      { key: 'crossesMidnight', label: 'Crosses midnight', type: 'checkbox' },
      { key: 'breakMinutes', label: 'Break minutes', type: 'number' },
      ACTIVE,
    ],
  },
}

export function getResource(key) {
  return RESOURCES[key]
}
