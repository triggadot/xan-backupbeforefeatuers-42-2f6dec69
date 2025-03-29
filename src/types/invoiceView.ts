export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  glideRowId: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate?: Date;
  total: number;
  balance: number;
  status: string;
  lineItemsCount: number;
  notes?: string;
  amountPaid: number;
  pdf_link?: string; // Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
}
