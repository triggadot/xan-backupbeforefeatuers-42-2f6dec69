
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  InvoiceWithDetails, 
  InvoiceListItem, 
  InvoiceLineItem, 
  InvoicePayment,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  AddLineItemInput,
  AddPaymentInput,
  InvoiceFilters,
  mapGlInvoiceToInvoiceListItem,
  mapGlInvoiceLineToLineItem,
  mapGlCustomerPaymentToPayment
} from '@/types/invoice';

type ProductDetails = {
  id: string;
  glide_row_id: string;
  name: string;
  display_name?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  cost?: number;
  total_qty_purchased?: number;
  category?: string;
  product_image1?: string;
  purchase_notes?: string;
  created_at: string;
  updated_at: string;
};

// Fetch product details for an invoice line
async function fetchProductDetails(productGlideId: string | null | undefined): Promise<ProductDetails | null> {
  if (!productGlideId) return null;
  
  try {
    const { data, error } = await supabase
      .from('gl_products')
      .select('*')
      .eq('glide_row_id', productGlideId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      glide_row_id: data.glide_row_id,
      name: data.display_name || data.new_product_name || data.vendor_product_name || 'Unnamed Product',
      display_name: data.display_name,
      vendor_product_name: data.vendor_product_name,
      new_product_name: data.new_product_name,
      cost: data.cost,
      total_qty_purchased: data.total_qty_purchased,
      category: data.category,
      product_image1: data.product_image1,
      purchase_notes: data.purchase_notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (err) {
    console.error('Error fetching product details:', err);
    return null;
  }
}

export function useInvoices(initialFilters?: InvoiceFilters) {
  const [filters, setFilters] = useState<InvoiceFilters>(initialFilters || {});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for invoice list
  const {
    data: invoices = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      try {
        // Build query for invoices based on filters
        let query = supabase
          .from('gl_invoices')
          .select(`
            *,
            accounts:gl_accounts(account_name),
            lineItemCount:gl_invoice_lines(count)
          `)
          .order('created_at', { ascending: false });
        
        // Apply filters
        if (filters.search) {
          query = query.or(`glide_row_id.ilike.%${filters.search}%,rowid_accounts.ilike.%${filters.search}%`);
        }
        
        if (filters.status && filters.status.length > 0) {
          query = query.in('payment_status', filters.status);
        }
        
        if (filters.customerId) {
          // Get the account's glide_row_id
          const { data: account } = await supabase
            .from('gl_accounts')
            .select('glide_row_id')
            .eq('id', filters.customerId)
            .single();
            
          if (account?.glide_row_id) {
            query = query.eq('rowid_accounts', account.glide_row_id);
          }
        }
        
        if (filters.dateFrom) {
          query = query.gte('invoice_order_date', filters.dateFrom.toISOString());
        }
        
        if (filters.dateTo) {
          query = query.lte('invoice_order_date', filters.dateTo.toISOString());
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Get payment totals for each invoice
        const invoiceIds = data.map(inv => inv.glide_row_id);
        
        const { data: payments, error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .select('rowid_invoices, payment_amount')
          .in('rowid_invoices', invoiceIds);
          
        if (paymentsError) throw paymentsError;
        
        // Calculate payment totals per invoice
        const paymentTotals: Record<string, number> = {};
        (payments || []).forEach(payment => {
          if (!paymentTotals[payment.rowid_invoices]) {
            paymentTotals[payment.rowid_invoices] = 0;
          }
          paymentTotals[payment.rowid_invoices] += Number(payment.payment_amount || 0);
        });
        
        // Map to InvoiceListItem array
        return data.map((invoice: any) => {
          // Extract account name from the nested object
          const accountName = invoice.accounts?.account_name || 'Unknown';
          const lineItemCount = invoice.lineItemCount?.[0]?.count || 0;
          const totalPaid = paymentTotals[invoice.glide_row_id] || 0;
          
          // Add these properties to the invoice object
          invoice.customerName = accountName;
          invoice.lineItemCount = lineItemCount;
          invoice.totalPaid = totalPaid;
          
          return mapGlInvoiceToInvoiceListItem(invoice);
        });
      } catch (err) {
        console.error('Error fetching invoices:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return [];
      }
    }
  });

  // Get a single invoice with full details
  const getInvoice = useCallback(async (id: string): Promise<InvoiceWithDetails | null> => {
    try {
      // Fetch the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error('Invoice not found');
      
      // Fetch the account
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', invoice.rowid_accounts)
        .maybeSingle();
      
      if (accountError) throw accountError;
      
      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (lineItemsError) throw lineItemsError;
      
      // Enhance line items with product details
      const enhancedLineItems = await Promise.all(
        (lineItems || []).map(async (line) => {
          if (line.rowid_products) {
            const productDetails = await fetchProductDetails(line.rowid_products);
            return {
              ...line,
              productDetails: productDetails || undefined
            };
          }
          return line;
        })
      );
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Map to domain model
      const mappedInvoice = {
        id: invoice.id,
        invoiceNumber: invoice.glide_row_id || 'Unknown',
        customerId: invoice.rowid_accounts || '',
        customerName: account?.account_name || 'Unknown Customer',
        invoiceDate: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        status: (invoice.processed ? invoice.payment_status as any || 'sent' : 'draft'),
        subtotal: Number(invoice.total_amount || 0),
        taxRate: invoice.tax_rate ? Number(invoice.tax_rate) : undefined,
        taxAmount: invoice.tax_amount ? Number(invoice.tax_amount) : undefined,
        total: Number(invoice.total_amount || 0),
        amountPaid: payments?.reduce((sum, p) => sum + Number(p.payment_amount || 0), 0) || 0,
        balance: Number(invoice.balance || 0),
        notes: invoice.notes || undefined,
        createdAt: new Date(invoice.created_at),
        updatedAt: new Date(invoice.updated_at),
        lineItems: enhancedLineItems.map(mapGlInvoiceLineToLineItem),
        payments: (payments || []).map(mapGlCustomerPaymentToPayment),
      };

      return mappedInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Create a new invoice
  const createInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceInput): Promise<string> => {
      try {
        // Get customer's glide_row_id
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .eq('id', data.customerId)
          .single();
          
        if (accountError) throw accountError;
        
        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('gl_invoices')
          .insert({
            rowid_accounts: account.glide_row_id,
            invoice_order_date: data.invoiceDate.toISOString(),
            due_date: data.dueDate?.toISOString(),
            processed: data.status === 'sent',
            notes: data.notes || ''
          })
          .select()
          .single();
          
        if (invoiceError) throw invoiceError;
        
        // Create line items
        if (data.lineItems.length > 0) {
          const lineItemsToInsert = data.lineItems.map(item => {
            // Calculate line total
            const lineTotal = item.quantity * item.unitPrice;
            
            return {
              rowid_invoices: invoice.glide_row_id,
              rowid_products: item.productId,
              renamed_product_name: item.description,
              qty_sold: item.quantity,
              selling_price: item.unitPrice,
              line_total: lineTotal,
              date_of_sale: new Date().toISOString()
            };
          });
          
          // Insert all line items
          const { error: lineItemError } = await supabase
            .from('gl_invoice_lines')
            .insert(lineItemsToInsert);
            
          if (lineItemError) throw lineItemError;
        }
        
        return invoice.id;
      } catch (err) {
        console.error('Error creating invoice:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
    }
  });

  // Update an existing invoice
  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateInvoiceInput }): Promise<boolean> => {
      try {
        // Fetch the invoice to get its glide_row_id
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Prepare update data
        const updateData: any = {};
        
        if (data.customerId) {
          // Get customer's glide_row_id
          const { data: account, error: accountError } = await supabase
            .from('gl_accounts')
            .select('glide_row_id')
            .eq('id', data.customerId)
            .single();
            
          if (accountError) throw accountError;
          updateData.rowid_accounts = account.glide_row_id;
        }
        
        if (data.invoiceDate) {
          updateData.invoice_order_date = data.invoiceDate.toISOString();
        }
        
        if (data.dueDate) {
          updateData.due_date = data.dueDate.toISOString();
        }
        
        if (data.status) {
          updateData.processed = data.status !== 'draft';
          updateData.payment_status = data.status;
        }
        
        if (data.notes !== undefined) {
          updateData.notes = data.notes;
        }
        
        // Update the invoice
        const { error: updateError } = await supabase
          .from('gl_invoices')
          .update(updateData)
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        return true;
      } catch (err) {
        console.error('Error updating invoice:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    }
  });

  // Delete an invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      try {
        // Fetch the invoice to get its glide_row_id
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Delete related payments
        const { error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (paymentsError) throw paymentsError;
        
        // Delete related line items
        const { error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (lineItemsError) throw lineItemsError;
        
        // Delete the invoice
        const { error: deleteError } = await supabase
          .from('gl_invoices')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        return true;
      } catch (err) {
        console.error('Error deleting invoice:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    }
  });

  // Add a line item to an invoice
  const addLineItem = useMutation({
    mutationFn: async (data: AddLineItemInput): Promise<boolean> => {
      try {
        // Fetch the invoice to get its glide_row_id
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', data.invoiceId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Calculate line total
        const lineTotal = data.quantity * data.unitPrice;
        
        // Insert line item
        const { error: insertError } = await supabase
          .from('gl_invoice_lines')
          .insert({
            rowid_invoices: invoice.glide_row_id,
            rowid_products: data.productId,
            renamed_product_name: data.description,
            qty_sold: data.quantity,
            selling_price: data.unitPrice,
            line_total: lineTotal,
            date_of_sale: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
        
        return true;
      } catch (err) {
        console.error('Error adding line item:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to add line item';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      toast({
        title: 'Success',
        description: 'Line item added successfully',
      });
    }
  });

  // Delete a line item
  const deleteLineItem = useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string, invoiceId: string }): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        return true;
      } catch (err) {
        console.error('Error deleting line item:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete line item';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    }
  });

  // Add a payment to an invoice
  const addPayment = useMutation({
    mutationFn: async (data: AddPaymentInput): Promise<boolean> => {
      try {
        // Fetch the invoice to get its glide_row_id
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', data.invoiceId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Fetch the account to get its glide_row_id
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .eq('id', data.accountId)
          .single();
          
        if (accountError) throw accountError;
        
        // Insert payment
        const { error: insertError } = await supabase
          .from('gl_customer_payments')
          .insert({
            rowid_invoices: invoice.glide_row_id,
            rowid_accounts: account.glide_row_id,
            payment_amount: data.amount,
            date_of_payment: data.paymentDate.toISOString(),
            type_of_payment: data.paymentMethod || '',
            payment_note: data.notes || ''
          });
          
        if (insertError) throw insertError;
        
        return true;
      } catch (err) {
        console.error('Error adding payment:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to add payment';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Payment added successfully',
      });
    }
  });

  // Delete a payment
  const deletePayment = useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string, invoiceId: string }): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        return true;
      } catch (err) {
        console.error('Error deleting payment:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  return {
    invoices,
    isLoading,
    error,
    refetch,
    filters,
    setFilters,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addLineItem,
    deleteLineItem,
    addPayment,
    deletePayment
  };
}
