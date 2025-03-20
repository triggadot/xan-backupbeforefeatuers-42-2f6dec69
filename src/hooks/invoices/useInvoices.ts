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

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('gl_invoices')
          .select(`
            *,
            accounts:gl_accounts(account_name),
            lineItemCount:gl_invoice_lines(count)
          `)
          .order('created_at', { ascending: false });
        
        if (filters.search) {
          query = query.or(`glide_row_id.ilike.%${filters.search}%,rowid_accounts.ilike.%${filters.search}%`);
        }
        
        if (filters.status && filters.status.length > 0) {
          query = query.in('payment_status', filters.status);
        }
        
        if (filters.customerId) {
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
        
        const invoiceIds = data.map(inv => inv.glide_row_id);
        
        const { data: payments, error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .select('rowid_invoices, payment_amount')
          .in('rowid_invoices', invoiceIds);
          
        if (paymentsError) throw paymentsError;
        
        const paymentTotals: Record<string, number> = {};
        (payments || []).forEach(payment => {
          if (!paymentTotals[payment.rowid_invoices]) {
            paymentTotals[payment.rowid_invoices] = 0;
          }
          paymentTotals[payment.rowid_invoices] += Number(payment.payment_amount || 0);
        });
        
        return data.map((invoice: any) => {
          const accountName = invoice.accounts?.account_name || 'Unknown';
          const lineItemCount = invoice.lineItemCount?.[0]?.count || 0;
          const totalPaid = paymentTotals[invoice.glide_row_id] || 0;
          
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

  const getInvoice = useCallback(async (id: string): Promise<InvoiceWithDetails | null> => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error('Invoice not found');
      
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', invoice.rowid_accounts)
        .maybeSingle();
      
      if (accountError) throw accountError;
      
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (lineItemsError) throw lineItemsError;
      
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
      
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
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

  const createInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceInput): Promise<string> => {
      try {
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .eq('id', data.customerId)
          .single();
          
        if (accountError) throw accountError;
        
        const { data: invoice, error: invoiceError } = await supabase
          .from('gl_invoices')
          .insert({
            rowid_accounts: account.glide_row_id,
            invoice_order_date: data.invoiceDate.toISOString(),
            processed: data.status === 'sent',
            notes: data.notes || '',
            total_amount: 0,
            total_paid: 0,
            balance: 0,
            payment_status: data.status || 'draft'
          })
          .select()
          .single();
          
        if (invoiceError) throw invoiceError;
        
        const lineItemsToInsert = data.lineItems.map(item => {
          const lineTotal = item.quantity * item.unitPrice;
          
          return {
            glide_row_id: crypto.randomUUID(),
            rowid_invoices: invoice.glide_row_id,
            rowid_products: item.productId,
            renamed_product_name: item.description,
            qty_sold: item.quantity,
            selling_price: item.unitPrice,
            line_total: lineTotal,
            date_of_sale: new Date().toISOString()
          };
        });
        
        const { error: lineItemError } = await supabase
          .from('gl_invoice_lines')
          .insert(lineItemsToInsert);
          
        if (lineItemError) throw lineItemError;
        
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

  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateInvoiceInput }): Promise<boolean> => {
      try {
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        const updateData: any = {};
        
        if (data.customerId) {
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

  const deleteInvoice = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      try {
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        const { error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (paymentsError) throw paymentsError;
        
        const { error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (lineItemsError) throw lineItemsError;
        
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

  const addLineItem = useMutation({
    mutationFn: async (data: AddLineItemInput): Promise<boolean> => {
      try {
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', data.invoiceId)
          .single();
          
        if (fetchError) throw fetchError;
        
        const lineTotal = data.quantity * data.unitPrice;
        
        const { error: insertError } = await supabase
          .from('gl_invoice_lines')
          .insert({
            glide_row_id: crypto.randomUUID(),
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

  const addPayment = useMutation({
    mutationFn: async (data: AddPaymentInput): Promise<boolean> => {
      try {
        const { data: invoice, error: fetchError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', data.invoiceId)
          .single();
          
        if (fetchError) throw fetchError;
        
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .eq('id', data.accountId)
          .single();
          
        if (accountError) throw accountError;
        
        const { error: insertError } = await supabase
          .from('gl_customer_payments')
          .insert({
            glide_row_id: crypto.randomUUID(),
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
