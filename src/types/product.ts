
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
