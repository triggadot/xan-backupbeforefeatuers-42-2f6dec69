
import { BaseService } from './base-service';
import { Invoice, InvoiceRow } from '@/types/invoice';
import { supabase } from '@/integrations/supabase/client';
import { asTable } from '@/utils/supabase';

// Mapper functions
const mapRowToInvoice = (row: InvoiceRow): Invoice => ({
  id: row.id,
  glideRowId: row.glide_row_id,
  invoiceUid: row.invoice_uid || '',
  accountId: row.rowid_accounts || '',
  date: row.date_of_invoice || '',
  status: row.payment_status || 'draft',
  totalAmount: row.total_amount || 0,
  totalPaid: row.total_paid || 0,
  balance: row.balance || 0,
  notes: row.notes || '',
  pdfUrl: row.supabase_pdf_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapInvoiceToRow = (invoice: Invoice): Partial<InvoiceRow> => ({
  id: invoice.id,
  glide_row_id: invoice.glideRowId,
  invoice_uid: invoice.invoiceUid,
  rowid_accounts: invoice.accountId,
  date_of_invoice: invoice.date,
  payment_status: invoice.status,
  total_amount: invoice.totalAmount,
  total_paid: invoice.totalPaid,
  balance: invoice.balance,
  notes: invoice.notes,
  supabase_pdf_url: invoice.pdfUrl,
  created_at: invoice.createdAt,
  updated_at: invoice.updatedAt
});

export class InvoiceService extends BaseService<InvoiceRow, Invoice> {
  constructor() {
    super('invoices', mapRowToInvoice, mapInvoiceToRow);
  }

  async getWithAccount(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from(asTable(this.tableName))
      .select(`
        *,
        account:gl_accounts!rowid_accounts(*)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    if (!data) return null;
    
    const invoice = mapRowToInvoice(data);
    
    if (data.account) {
      invoice.account = {
        id: data.account.id,
        name: data.account.account_name || '',
        type: data.account.client_type || '',
        glideRowId: data.account.glide_row_id
      };
    }
    
    return invoice;
  }

  async getWithLines(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from(asTable(this.tableName))
      .select(`
        *,
        account:gl_accounts!rowid_accounts(*),
        lines:gl_invoice_lines!rowid_invoices(*)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    if (!data) return null;
    
    const invoice = mapRowToInvoice(data);
    
    if (data.account) {
      invoice.account = {
        id: data.account.id,
        name: data.account.account_name || '',
        type: data.account.client_type || '',
        glideRowId: data.account.glide_row_id
      };
    }
    
    if (data.lines && Array.isArray(data.lines)) {
      invoice.lines = data.lines.map(line => ({
        id: line.id,
        glideRowId: line.glide_row_id || '',
        productId: line.rowid_products || '',
        invoiceId: line.rowid_invoices || '',
        productName: line.product_name_display || '',
        quantity: line.qty_sold || 0,
        price: line.selling_price || 0,
        total: line.line_total || 0,
        notes: line.sale_note || ''
      }));
    }
    
    return invoice;
  }

  async updatePdfUrl(id: string, pdfUrl: string): Promise<void> {
    const { error } = await supabase
      .from(asTable(this.tableName))
      .update({ supabase_pdf_url: pdfUrl })
      .eq('id', id);
      
    if (error) throw error;
  }
}

// Singleton instance
export const invoiceService = new InvoiceService();
