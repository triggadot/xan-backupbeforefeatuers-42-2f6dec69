
// Update the UnpaidProduct interface to match what's returned by the useUnpaidInventory hook
export interface UnpaidProduct {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unpaid_value: number;
  unpaid_type: 'Sample' | 'Fronted';
  date_created: string;
  customer_name: string;
  customer_id: string;
}
