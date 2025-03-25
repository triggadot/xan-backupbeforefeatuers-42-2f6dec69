
import { EntityBase, EntityStatus } from './common';

export interface Product extends EntityBase {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  cost: number;
  quantity: number;
  status: EntityStatus;
  vendorId?: string;
  vendorName?: string;
  imageUrl?: string;
  
  // Additional fields for business logic
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  purchaseDate?: Date | null;
  frontedTerms?: string;
  totalUnitsBehindSample?: number;
}

export interface ProductInvoiceLine {
  id: string;
  productId: string;
  invoiceId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
  notes?: string;
}

export interface ProductEstimateLine {
  id: string;
  productId: string;
  estimateId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
  notes?: string;
}

export interface UnpaidProduct {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unpaid_value: number;
  unpaid_type: string;
  date_created: string;
  created_at: string;
  customer_name: string;
  customer_id: string;
  product_image?: string;
  notes?: string;
  status: string;
  is_sample: boolean;
  is_fronted: boolean;
  payment_status: string;
  
  // Additional fields from the DB that we need to reference
  vendor_product_name?: string;
  new_product_name?: string;
  display_name?: string;
  vendor_name?: string;
  total_qty_purchased?: number;
  cost?: number;
  terms_for_fronted_product?: string;
  glide_row_id?: string;
}

export interface ProductFilters {
  category?: string;
  vendorId?: string;
  status?: EntityStatus;
  search?: string;
  onlySamples?: boolean;
  onlyFronted?: boolean;
}
