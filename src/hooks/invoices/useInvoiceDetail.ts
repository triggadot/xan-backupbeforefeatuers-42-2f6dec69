
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceWithDetails, InvoiceLineItem, InvoicePayment } from '@/types/invoice';
import { hasProperty } from '@/types/supabase';

export function useInvoiceDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoice = async (id: string): Promise<InvoiceWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the new materialized view for better performance, but cast it to any to avoid type errors
      const { data: invoice, error: invoiceError } = await supabase
        .from('mv_invoice_customer_details' as any)
        .select(`
          *,
          customer:rowid_accounts(*)
        `)
        .eq('glide_row_id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Safely handle customer data
      let customerName = 'Unknown Customer';
      let customerData = undefined;
      
      if (invoice.customer && 
          typeof invoice.customer === 'object' && 
          invoice.customer !== null) {
        customerData = invoice.customer;
        
        if (hasProperty(invoice.customer, 'account_name')) {
          customerName = invoice.customer.account_name || 'Unknown Customer';
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
        id: item.id,
        invoiceId: item.rowid_invoices,
        productId: item.rowid_products || '',
        description: item.renamed_product_name || '',
        productName: item.renamed_product_name || 'Unnamed Product',
        quantity: Number(item.qty_sold || 0),
        unitPrice: Number(item.selling_price || 0),
        total: Number(item.line_total || 0),
        notes: item.product_sale_note || '',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        productDetails: item.product || undefined
      }));
      
      const formattedPayments: InvoicePayment[] = payments.map(payment => ({
        id: payment.id,
        invoiceId: payment.rowid_invoices,
        accountId: payment.rowid_accounts || '',
        date: new Date(payment.date_of_payment || payment.created_at),
        amount: Number(payment.payment_amount || 0),
        paymentMethod: payment.type_of_payment || 'Payment',
        notes: payment.payment_note || '',
        paymentDate: new Date(payment.date_of_payment || payment.created_at),
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      }));
      
      // Calculate subtotal
      const subtotal = formattedLineItems.reduce((sum, item) => sum + item.total, 0);
      
      // Use actual due_date or calculate it (30 days after invoice date)
      const invoiceDate = invoice.invoice_order_date 
        ? new Date(invoice.invoice_order_date) 
        : new Date(invoice.created_at);
      
      const dueDate = invoice.due_date 
        ? new Date(invoice.due_date) 
        : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Ensure status is one of the valid types
      let status = invoice.payment_status || 'draft';
      if (!['draft', 'sent', 'paid', 'partial', 'overdue'].includes(status)) {
        status = 'draft';
      }
      
      // Calculate amount paid
      const amountPaid = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        id: invoice.glide_row_id,
        glide_row_id: invoice.glide_row_id,
        invoiceNumber: invoice.glide_row_id,
        customerId: invoice.rowid_accounts || '',
        customerName: customerName,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        status: status as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue',
        total_amount: Number(invoice.total_amount || 0),
        total_paid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        lineItems: formattedLineItems,
        payments: formattedPayments,
        account: customerData,
        total: subtotal,
        subtotal: subtotal,
        amountPaid: amountPaid,
        notes: invoice.notes || '',
        tax_rate: Number(invoice.tax_rate || 0),
        tax_amount: Number(invoice.tax_amount || 0),
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        createdAt: new Date(invoice.created_at),
        updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined
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
