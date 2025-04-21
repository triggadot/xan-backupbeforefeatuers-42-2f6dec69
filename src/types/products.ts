
import { Account } from './accounts';
import { BaseEntity, BaseRow, EntityStatus } from './base';
import { PurchaseOrder } from './purchase-orders';

export interface ProductRow extends BaseRow {
  product_sku?: string;
  new_product_sku?: string;
  display_name?: string;
  new_product_name?: string;
  vendor_product_name?: string;
  category?: string;
  cost?: number;
  total_cost?: number;
  public_url_image?: string;
  public_url_video?: string;
  rowid_accounts?: string;
  rowid_purchase_orders?: string;
  rowid_vendor_payments?: string;
  purchase_order_uid?: string;
  purchase_note?: string;
  date_of_purchase?: string;
  total_qty_purchased?: number;
  is_sample?: boolean;
  is_fronted?: boolean;
  is_sample_or_fronted?: boolean;
  is_miscellaneous?: boolean;
  terms_for_fronted_product?: string;
  product_image1?: string;
}

export interface Product extends BaseEntity {
  sku: string;
  displayName: string;
  category?: string;
  cost?: number;
  totalCost?: number;
  imageUrl?: string;
  videoUrl?: string;
  accountId?: string;
  purchaseOrderId?: string;
  vendorPaymentId?: string;
  purchaseOrderUid?: string;
  purchaseNote?: string;
  purchaseDate?: string;
  totalQuantityPurchased?: number;
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  frontedTerms?: string;
  productImage?: string;
  status?: EntityStatus;
}

export interface ProductDetail extends Product {
  account?: Account;
  purchaseOrder?: PurchaseOrder;
  stats?: ProductStats;
  sales?: ProductSale[];
}

export interface ProductStats {
  totalQuantity: number;
  quantitySold: number;
  quantityAvailable: number;
  totalRevenue: number;
  totalProfit: number;
  marginPercentage: number;
  daysInInventory?: number;
  daysSinceLastSale?: number;
  turnoverRate?: number;
}

export interface ProductSale {
  id: string;
  date: string;
  quantity: number;
  price: number;
  total: number;
  documentType: 'invoice' | 'estimate';
  documentId: string;
  documentNumber: string;
}

export interface ProductFormData {
  sku: string;
  displayName: string;
  category?: string;
  cost?: number;
  accountId?: string;
  purchaseOrderId?: string;
  purchaseNote?: string;
  purchaseDate?: string;
  totalQuantityPurchased?: number;
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  frontedTerms?: string;
  imageUrl?: string;
}
