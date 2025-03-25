
import { EntityBase } from './common';

export interface Product extends EntityBase {
  display_name?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  cost?: number;
  total_qty_purchased?: number;
  category?: string;
  product_image1?: string;
  purchase_notes?: string;
  rowid_accounts?: string;
  rowid_purchase_orders?: string;
  product_purchase_date?: string;
  vendor?: {
    id: string;
    account_name: string;
  };
  // Sample and fronted fields
  samples?: boolean;
  fronted?: boolean;
  total_units_behind_sample?: number;
  terms_for_fronted_product?: string;
  miscellaneous_items?: boolean;
  
  // UI helper fields
  name?: string; // Computed from display_name or vendor_product_name
  vendorName?: string;
  totalCost?: number; // Computed from cost * total_qty_purchased
  currentInventory?: number;
  totalSold?: number;
  totalSampled?: number;
}

export interface ProductWithInventory extends Product {
  current_inventory: number;
  total_sold: number;
  inventory_value: number;
  payment_status: string;
  sample_value?: number;
  fronted_value?: number;
}

export interface UnpaidProduct extends Product {
  unpaid_value: number;
  unpaid_type: string;
  vendor_name?: string;
}

export interface ProductFilters {
  category?: string;
  vendorId?: string;
  search?: string;
  inStock?: boolean;
  showSamples?: boolean;
  showFronted?: boolean;
}
