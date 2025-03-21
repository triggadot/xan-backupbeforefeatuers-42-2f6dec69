
export interface UnpaidProduct {
  id: string;
  product_id: string;
  product_name: string;
  name: string; // Added for component compatibility
  quantity: number;
  unpaid_value: number;
  unpaid_type: 'Sample' | 'Fronted';
  date_created: string;
  customer_name: string;
  customer_id: string;
  vendor_name: string; // Added for component compatibility
  cost: number; // Added for component compatibility
  terms_for_fronted_product?: string; // Added for component compatibility
  glide_row_id: string; // Added for component compatibility
  inventory_value: number; // Added for component compatibility
  payment_status: string; // Added for component compatibility
}
