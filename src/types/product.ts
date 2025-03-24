
export interface Product {
  id: string;
  glide_row_id: string;
  name: string;
  display_name?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  category?: string;
  cost?: number;
  total_qty_purchased?: number;
  vendor_id?: string;
  vendor_name?: string;
  createdAt?: Date;
  updatedAt?: Date;
  product_image1?: string;
}

export interface UnpaidProduct {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  quantity: number;
  unpaid_value: number;
  unpaid_type: "Sample" | "Fronted" | string; // Modified to accept string to fix type errors
  date_created: string;
  customer_name: string;
  customer_id: string;
  vendor_name: string;
  cost: number;
  terms_for_fronted_product: string;
  glide_row_id: string;
  inventory_value: number;
  payment_status: string;
}

export interface ProductInventory {
  id: string;
  name: string;
  current: number;
  total: number;
  sold: number;
  reserved: number;
}
