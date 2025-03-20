
export interface BusinessMetrics {
  total_invoices: number;
  total_estimates: number;
  total_purchase_orders: number;
  total_products: number;
  total_customers: number;
  total_vendors: number;
  total_invoice_amount: number;
  total_payments_received: number;
  total_outstanding_balance: number;
  total_purchase_amount: number;
  total_payments_made: number;
  total_purchase_balance: number;
}

export interface StatusMetrics {
  category: string;
  total_count: number;
  paid_count: number;
  unpaid_count: number;
  draft_count: number;
  total_amount: number;
  total_paid: number;
  balance_amount: number;
}

export interface BusinessOperations {
  // Account type determination
  determineAccountType: (isCustomer: boolean, isVendor: boolean) => 'Customer' | 'Vendor' | 'Customer & Vendor';
  extractAccountFlags: (type: 'Customer' | 'Vendor' | 'Customer & Vendor') => { is_customer: boolean; is_vendor: boolean };
  
  // Metric calculations
  calculateTotalBalance: (total: number, paid: number) => number;
  calculateAmountDue: (lineItems: any[]) => number;
  
  // Status determinations 
  determineInvoiceStatus: (total: number, paid: number, dueDate?: Date) => 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  determinePurchaseOrderStatus: (total: number, paid: number) => 'draft' | 'pending' | 'complete' | 'partial';
}
