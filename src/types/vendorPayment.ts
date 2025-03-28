
export interface VendorPayment {
  id: string;
  amount: number;
  paymentDate: string;
  method?: string;
  notes?: string;
  purchaseOrderId?: string;
}
