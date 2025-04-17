import { TableName } from '@/types/glide-sync/glsync.unified';

/**
 * Table information for display purposes in the sync dashboard
 */
export const TABLE_INFO: Record<string, { displayName: string; description: string }> = {
  gl_accounts: {
    displayName: 'Accounts',
    description: 'Customer and vendor accounts information'
  },
  gl_invoices: {
    displayName: 'Invoices',
    description: 'Customer invoices and orders'
  },
  gl_invoice_lines: {
    displayName: 'Invoice Line Items',
    description: 'Individual line items on invoices'
  },
  gl_products: {
    displayName: 'Products',
    description: 'Product catalog and inventory'
  },
  gl_purchase_orders: {
    displayName: 'Purchase Orders',
    description: 'Orders made to vendors'
  },
  gl_estimates: {
    displayName: 'Estimates',
    description: 'Customer estimates and quotes'
  },
  gl_estimate_lines: {
    displayName: 'Estimate Line Items',
    description: 'Individual line items on estimates'
  },
  gl_customer_payments: {
    displayName: 'Customer Payments',
    description: 'Payments received from customers'
  },
  gl_vendor_payments: {
    displayName: 'Vendor Payments',
    description: 'Payments made to vendors'
  },
  gl_expenses: {
    displayName: 'Expenses',
    description: 'Business expenses and transactions'
  },
  gl_shipping_records: {
    displayName: 'Shipping Records',
    description: 'Shipping and delivery information'
  },
  gl_mappings: {
    displayName: 'Glide Mappings',
    description: 'Table mapping configurations for Glide sync'
  },
  gl_connections: {
    displayName: 'Glide Connections',
    description: 'API connections to Glide'
  },
  gl_sync_logs: {
    displayName: 'Sync Logs',
    description: 'Logs of sync operations'
  },
  gl_sync_errors: {
    displayName: 'Sync Errors',
    description: 'Errors encountered during sync operations'
  },
  gl_mapping_status: {
    displayName: 'Mapping Status',
    description: 'Current status of sync mappings'
  },
  gl_product_sync_stats: {
    displayName: 'Product Sync Stats',
    description: 'Statistics for product synchronization'
  },
  gl_recent_logs: {
    displayName: 'Recent Logs',
    description: 'Recently created sync logs'
  },
  gl_sync_stats: {
    displayName: 'Sync Statistics',
    description: 'Aggregated sync operation statistics'
  },
  gl_tables_view: {
    displayName: 'Tables View',
    description: 'Overview of tables in the database'
  }
};
