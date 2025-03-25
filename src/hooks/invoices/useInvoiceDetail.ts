
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceWithDetails } from '@/types/invoice';

export function useInvoiceDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoice = async (id: string): Promise<InvoiceWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          customer:rowid_accounts(*)
        `)
        .eq('glide_row_id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Get line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          product:rowid_products(*)
        `)
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (lineItemsError) throw lineItemsError;
      
      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Convert from DB format to InvoiceWithDetails format
      const formattedLineItems = lineItems.map(item => ({
        id: item.id,
        invoiceId: invoice.glide_row_id,
        productId: item.rowid_products || '',
        description: item.renamed_product_name || '',
        productName: item.renamed_product_name || '',
        quantity: Number(item.qty_sold || 0),
        unitPrice: Number(item.selling_price || 0),
        total: Number(item.line_total || 0),
        notes: item.product_sale_note || '',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        productDetails: item.product
      }));
      
      const formattedPayments = payments.map(payment => ({
        id: payment.id,
        invoiceId: invoice.glide_row_id,
        accountId: payment.rowid_accounts || '',
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
        amount: Number(payment.payment_amount || 0),
        paymentMethod: payment.type_of_payment || 'Payment',
        notes: payment.payment_note || '',
        paymentDate: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      }));
      
      // Calculate the total amount paid
      const totalPaid = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Safely get customer name with null checks
      let customerName = 'Unknown Customer';
      if (invoice.customer && 
          typeof invoice.customer === 'object' && 
          invoice.customer !== null) {
        customerName = invoice.customer.account_name || 'Unknown Customer';
      }
      
      // Safely determine if we have account data
      let accountData = undefined;
      if (invoice.customer && 
          typeof invoice.customer === 'object' && 
          invoice.customer !== null) {
        accountData = invoice.customer;
      }
      
      return {
        id: invoice.id,
        glide_row_id: invoice.glide_row_id,
        invoiceNumber: invoice.glide_row_id || invoice.id.substring(0, 8),
        customerId: invoice.rowid_accounts || '',
        customerName: customerName,
        invoiceDate: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
        status: (invoice.payment_status || 'draft') as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue',
        total_amount: Number(invoice.total_amount || 0),
        total_paid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        notes: invoice.notes || '',
        lineItems: formattedLineItems,
        payments: formattedPayments,
        account: accountData,
        amountPaid: totalPaid,
        subtotal: Number(invoice.total_amount || 0),
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        createdAt: new Date(invoice.created_at),
        updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined
      };
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching invoice');
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
