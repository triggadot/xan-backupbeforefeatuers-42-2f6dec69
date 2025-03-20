
import { GlAccount, ProductDetails } from './index';

export interface InvoiceLine {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  productImage?: string;
  productDetails?: ProductDetails;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  accountId: string;
  accountName: string;
  date: Date;
  dueDate?: Date | null;
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  total: number;
  subtotal: number;
  tax: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lineItems: InvoiceLine[];
  payments: Payment[];
}

export interface Payment {
  id: string;
  date: Date;
  amount: number;
  method?: string;
  notes?: string;
}
