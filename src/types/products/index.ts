export type {
  GlProductRecord,
  GlProductInsert,
  GlProductUpdate,
  Product,
  ProductForm,
  ProductFilters
} from '@/types/products/product-types';

// Product summary statistics for dashboard/analytics
export interface ProductSummary {
  totalProducts: number;
  totalValue: number;
  sampleCount: number;
  frontedCount: number;
  miscCount: number;
  byCategory: {
    category: string;
    count: number;
    value: number;
  }[];
  byVendor: {
    vendorId: string;
    vendorName: string;
    count: number;
    value: number;
  }[];
}
