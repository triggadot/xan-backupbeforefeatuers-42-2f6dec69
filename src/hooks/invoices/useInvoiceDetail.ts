
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceWithDetails } from '@/types/invoice';

export function useInvoiceDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a single invoice with all related details
  const getInvoice = async (id: string): Promise<InvoiceWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          account:rowid_accounts(*)
        `)
        .eq('id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Get invoice line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          productDetails:rowid_products(*)
        `)
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (lineItemsError) throw lineItemsError;
      
      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Format the result as InvoiceWithDetails
      return {
        id: invoice.id,
        invoiceNumber: invoice.glide_row_id || 'Unknown',
        glideRowId: invoice.glide_row_id,
        customerId: invoice.rowid_accounts,
        customerName: invoice.account?.account_name || 'Unknown Customer',
        date: new Date(invoice.invoice_order_date || invoice.created_at),
        dueDate: undefined, // Due date is not used in the database
        status: invoice.payment_status || 'draft',
        total: Number(invoice.total_amount || 0),
        totalPaid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        lineItems: lineItems.map(item => ({
          id: item.id,
          invoiceId: invoice.id,
          productId: item.rowid_products || '',
          description: item.renamed_product_name || '',
          productName: item.renamed_product_name || (item.productDetails && item.productDetails.display_name) || 'Unknown Product',
          quantity: Number(item.qty_sold || 0),
          unitPrice: Number(item.selling_price || 0),
          total: Number(item.line_total || 0),
          notes: item.product_sale_note,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          productDetails: item.productDetails
        })),
        payments: payments.map(payment => ({
          id: payment.id,
          invoiceId: invoice.id,
          accountId: payment.rowid_accounts || '',
          date: new Date(payment.date_of_payment || payment.created_at),
          amount: Number(payment.payment_amount || 0),
          method: payment.type_of_payment || '',
          notes: payment.payment_note || '',
          paymentDate: payment.date_of_payment || payment.created_at,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }))
      };
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getInvoice,
    isLoading,
    error
  };
}
