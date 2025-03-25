
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceWithDetails, InvoiceLineItem, InvoicePayment } from '@/types/invoice';
import { 
  InvoiceRow,
  hasProperty, 
  asNumber,
  asDate,
  parseJsonIfString,
  asString
} from '@/types/supabase';

export function useInvoiceDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoice = async (id: string): Promise<InvoiceWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Refresh the materialized view
      await supabase.rpc('refresh_materialized_view_secure', {
        view_name: 'mv_invoice_customer_details'
      });
      
      // Fetch from the materialized view
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('mv_invoice_customer_details')
        .select('*')
        .eq('glide_row_id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      if (!invoiceData) {
        throw new Error(`Invoice with ID ${id} not found`);
      }

      const invoice = invoiceData as InvoiceRow;
      
      // Safely handle customer data
      let customerName = 'Unknown Customer';
      let customerData = undefined;
      
      if (invoice.customer) {
        // If it's a string (JSON), parse it
        const customerObj = parseJsonIfString<Record<string, unknown>>(invoice.customer);
          
        customerData = customerObj;
        
        if (customerObj && hasProperty(customerObj, 'account_name')) {
          customerName = asString(customerObj.account_name) || 'Unknown Customer';
        }
      }
      
      // Fetch line items and payments
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          product:rowid_products(*)
        `)
        .eq('rowid_invoices', id);
        
      if (lineItemsError) throw lineItemsError;
      
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', id);
        
      if (paymentsError) throw paymentsError;
      
      // Format line items and payments
      const formattedLineItems: InvoiceLineItem[] = lineItems.map(item => ({
        id: String(item.id || ''),
        invoiceId: String(item.rowid_invoices || ''),
        productId: String(item.rowid_products || ''),
        description: String(item.renamed_product_name || ''),
        productName: String(item.renamed_product_name || 'Unnamed Product'),
        quantity: asNumber(item.qty_sold || 0),
        unitPrice: asNumber(item.selling_price || 0),
        total: asNumber(item.line_total || 0),
        notes: String(item.product_sale_note || ''),
        createdAt: asDate(item.created_at) || new Date(),
        updatedAt: asDate(item.updated_at) || new Date(),
        productDetails: item.product || undefined
      }));
      
      const formattedPayments: InvoicePayment[] = payments.map(payment => ({
        id: String(payment.id || ''),
        invoiceId: String(payment.rowid_invoices || ''),
        accountId: String(payment.rowid_accounts || ''),
        date: asDate(payment.date_of_payment) || asDate(payment.created_at) || new Date(),
        amount: asNumber(payment.payment_amount || 0),
        paymentMethod: String(payment.type_of_payment || 'Payment'),
        notes: String(payment.payment_note || ''),
        paymentDate: asDate(payment.date_of_payment) || asDate(payment.created_at) || new Date(),
        createdAt: asDate(payment.created_at) || new Date(),
        updatedAt: asDate(payment.updated_at) || new Date()
      }));
      
      // Calculate subtotal
      const subtotal = formattedLineItems.reduce((sum, item) => sum + item.total, 0);
      
      // Use actual due_date or calculate it (30 days after invoice date)
      const invoiceDate = asDate(invoice.invoice_order_date) || asDate(invoice.created_at) || new Date();
      
      const dueDate = asDate(invoice.due_date) || 
        new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Ensure status is one of the valid types
      let status = String(invoice.payment_status || 'draft');
      if (!['draft', 'sent', 'paid', 'partial', 'overdue'].includes(status)) {
        status = 'draft';
      }
      
      // Calculate amount paid
      const amountPaid = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        id: String(invoice.glide_row_id || ''),
        glide_row_id: String(invoice.glide_row_id || ''),
        invoiceNumber: String(invoice.glide_row_id || ''),
        customerId: String(invoice.rowid_accounts || ''),
        customerName: customerName,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        status: status as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue',
        total_amount: asNumber(invoice.total_amount || 0),
        total_paid: asNumber(invoice.total_paid || 0),
        balance: asNumber(invoice.balance || 0),
        lineItems: formattedLineItems,
        payments: formattedPayments,
        account: customerData,
        total: subtotal,
        subtotal: subtotal,
        amountPaid: amountPaid,
        notes: String(invoice.notes || ''),
        tax_rate: asNumber(invoice.tax_rate || 0),
        tax_amount: asNumber(invoice.tax_amount || 0),
        created_at: String(invoice.created_at || ''),
        updated_at: String(invoice.updated_at || ''),
        createdAt: asDate(invoice.created_at) || new Date(),
        updatedAt: asDate(invoice.updated_at) || undefined
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching invoice';
      setError(errorMessage);
      console.error('Error fetching invoice:', err);
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
