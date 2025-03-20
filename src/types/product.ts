
export interface Product {
  id: string;
  glide_row_id: string;
  name: string;
  display_name: string;
  new_product_name?: string;
  vendor_product_name?: string;
  sku: string;
  cost: number;
  quantity: number;
  total_qty_purchased: number;
  category?: string;
  notes?: string;
  purchase_notes?: string;
  product_image1?: string;
  product_purchase_date?: string;
  samples?: boolean;
  fronted?: boolean;
  samples_or_fronted?: boolean;
  miscellaneous_items?: boolean;
  total_units_behind_sample?: number;
  terms_for_fronted_product?: string;
  created_at: string;
  updated_at: string;
}

export interface UnpaidProduct extends Product {
  unpaid_type: 'Sample' | 'Fronted';
  unpaid_value: number;
  vendor_name: string;
  inventory_value: number;
  sample_value?: number;
  fronted_value?: number;
  payment_status: 'Sample' | 'Fronted' | 'Paid';
  terms_for_fronted_product?: string;
}
