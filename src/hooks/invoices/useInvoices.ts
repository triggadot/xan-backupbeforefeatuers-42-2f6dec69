
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  InvoiceListItem, 
  InvoiceWithDetails, 
  InvoiceFilters, 
  CreateInvoiceInput, 
  UpdateInvoiceInput, 
  AddLineItemInput, 
  UpdateLineItemInput, 
  AddPaymentInput,
  mapGlInvoiceToInvoiceListItem,
  mapGlInvoiceLineToLineItem,
  mapGlCustomerPaymentToPayment
} from '@/types/invoice';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

export const useInvoices = (filters?: InvoiceFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List invoices with filtering
  const fetchInvoices = useCallback(async (filters?: InvoiceFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('mv_invoice_customer_details')
        .select('*');
      
      // Apply filters
      if (filters?.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,glide_row_id.ilike.%${filters.search}%`);
      }
      
      if (filters?.status && filters.status.length > 0) {
        query = query.in('payment_status', filters.status);
      }
      
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('invoice_order_date', filters.dateFrom.toISOString());
      }
      
      if (filters?.dateTo) {
        query = query.lte('invoice_order_date', filters.dateTo.toISOString());
      }
      
      const { data, error } = await query.order('invoice_order_date', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to our app's type
      const invoices: InvoiceListItem[] = (data || []).map(invoice => ({
        id: invoice.invoice_id,
        invoiceNumber: invoice.glide_row_id || 'Unknown',
        customerId: invoice.customer_id || '',
        customerName: invoice.customer_name || 'Unknown Customer',
        invoiceDate: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
        status: invoice.payment_status as any || 'draft',
        total: Number(invoice.total_amount || 0),
        amountPaid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        lineItemCount: Number(invoice.line_count || 0),
        createdAt: new Date(invoice.created_at),
        updatedAt: new Date(invoice.updated_at),
      }));
      
      setIsLoading(false);
      return invoices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return [];
    }
  }, [toast]);

  // Get a single invoice with all details
  const getInvoice = useCallback(async (id: string): Promise<InvoiceWithDetails | null> => {
    setIsLoading(true);
    try {
      // Get the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          gl_accounts!gl_invoices_rowid_accounts_fkey(id, account_name)
        `)
        .eq('id', id)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoiceData) throw new Error('Invoice not found');
      
      // Get line items with product details
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          gl_products!gl_invoice_lines_rowid_products_fkey(*)
        `)
        .eq('rowid_invoices', invoiceData.glide_row_id);
      
      if (lineItemsError) throw lineItemsError;
      
      // Get payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoiceData.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Create the full invoice object
      const accountData = invoiceData.gl_accounts || { id: null, account_name: 'Unknown Customer' };
      
      const lineItems = (lineItemsData || []).map(line => {
        const productDetails = line.gl_products ? {
          id: line.gl_products.id,
          glide_row_id: line.gl_products.glide_row_id,
          name: line.gl_products.display_name || line.gl_products.new_product_name || line.gl_products.vendor_product_name || 'Unnamed Product',
          display_name: line.gl_products.display_name,
          vendor_product_name: line.gl_products.vendor_product_name,
          new_product_name: line.gl_products.new_product_name,
          cost: line.gl_products.cost,
          total_qty_purchased: line.gl_products.total_qty_purchased,
          category: line.gl_products.category,
          product_image1: line.gl_products.product_image1,
          purchase_notes: line.gl_products.purchase_notes,
          created_at: line.gl_products.created_at,
          updated_at: line.gl_products.updated_at
        } : undefined;
        
        return mapGlInvoiceLineToLineItem({
          ...line,
          productDetails
        });
      });
      
      const payments = (paymentsData || []).map(payment => 
        mapGlCustomerPaymentToPayment(payment)
      );
      
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      
      const invoice: InvoiceWithDetails = {
        id: invoiceData.id,
        invoiceNumber: invoiceData.glide_row_id || 'Unknown',
        customerId: accountData.id || '',
        customerName: accountData.account_name || 'Unknown Customer',
        invoiceDate: invoiceData.invoice_order_date ? new Date(invoiceData.invoice_order_date) : new Date(invoiceData.created_at),
        dueDate: invoiceData.invoice_order_date ? new Date(new Date(invoiceData.invoice_order_date).getTime() + 30 * 24 * 60 * 60 * 1000) : undefined, // 30 days from invoice date
        status: (invoiceData.payment_status || 'draft') as any,
        subtotal,
        total: subtotal, // Assuming no tax for now
        amountPaid: totalPaid,
        balance: subtotal - totalPaid,
        notes: invoiceData.notes,
        lineItems,
        payments,
        createdAt: new Date(invoiceData.created_at),
        updatedAt: new Date(invoiceData.updated_at),
      };
      
      setIsLoading(false);
      return invoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice details';
      console.error('Error fetching invoice:', errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  }, [toast]);

  // Create invoice
  const createInvoice = useCallback(async (data: CreateInvoiceInput): Promise<string | null> => {
    setIsLoading(true);
    try {
      // Get customer glide_row_id from customer id
      const { data: customerData, error: customerError } = await supabase
        .from('gl_accounts')
        .select('glide_row_id')
        .eq('id', data.customerId)
        .single();
      
      if (customerError) throw customerError;
      if (!customerData?.glide_row_id) throw new Error('Customer not found');
      
      // Create the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('gl_invoices')
        .insert({
          rowid_accounts: customerData.glide_row_id,
          invoice_order_date: data.invoiceDate.toISOString(),
          processed: data.status === 'sent',
          notes: data.notes
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoiceData) throw new Error('Failed to create invoice');
      
      // Create line items
      if (data.lineItems && data.lineItems.length > 0) {
        const lineItemsToInsert = await Promise.all(
          data.lineItems.map(async (item) => {
            // Get product glide_row_id from product id
            const { data: productData, error: productError } = await supabase
              .from('gl_products')
              .select('glide_row_id, display_name')
              .eq('id', item.productId)
              .single();
            
            if (productError) throw productError;
            if (!productData?.glide_row_id) throw new Error(`Product not found: ${item.productId}`);
            
            return {
              rowid_invoices: invoiceData.glide_row_id,
              rowid_products: productData.glide_row_id,
              renamed_product_name: item.description || productData.display_name,
              qty_sold: item.quantity,
              selling_price: item.unitPrice,
              line_total: item.quantity * item.unitPrice,
              date_of_sale: data.invoiceDate.toISOString()
            };
          })
        );
        
        const { error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .insert(lineItemsToInsert);
        
        if (lineItemsError) throw lineItemsError;
      }
      
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      setIsLoading(false);
      return invoiceData.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  }, [toast, queryClient]);

  // Update invoice
  const updateInvoice = useCallback(async (id: string, data: UpdateInvoiceInput): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get the existing invoice first
      const { data: existingInvoice, error: fetchError } = await supabase
        .from('gl_invoices')
        .select('glide_row_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      if (!existingInvoice) throw new Error('Invoice not found');
      
      // Prepare update data
      const updateData: any = {};
      
      if (data.customerId) {
        // Get customer glide_row_id from customer id
        const { data: customerData, error: customerError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .eq('id', data.customerId)
          .single();
        
        if (customerError) throw customerError;
        if (!customerData?.glide_row_id) throw new Error('Customer not found');
        
        updateData.rowid_accounts = customerData.glide_row_id;
      }
      
      if (data.invoiceDate) {
        updateData.invoice_order_date = data.invoiceDate.toISOString();
      }
      
      if (data.status) {
        updateData.payment_status = data.status;
        updateData.processed = data.status !== 'draft';
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
      
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // Delete invoice
  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get the existing invoice first to get the glide_row_id
      const { data: existingInvoice, error: fetchError } = await supabase
        .from('gl_invoices')
        .select('glide_row_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      if (!existingInvoice) throw new Error('Invoice not found');
      
      // Delete line items first (foreign key constraint)
      const { error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .delete()
        .eq('rowid_invoices', existingInvoice.glide_row_id);
      
      if (lineItemsError) throw lineItemsError;
      
      // Delete payments (foreign key constraint)
      const { error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .delete()
        .eq('rowid_invoices', existingInvoice.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Finally delete the invoice
      const { error: deleteError } = await supabase
        .from('gl_invoices')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // Add a line item to an invoice
  const addLineItem = useCallback(async (data: AddLineItemInput): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get invoice glide_row_id
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('glide_row_id, invoice_order_date')
        .eq('id', data.invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoiceData) throw new Error('Invoice not found');
      
      // Get product glide_row_id
      const { data: productData, error: productError } = await supabase
        .from('gl_products')
        .select('glide_row_id, display_name')
        .eq('id', data.productId)
        .single();
      
      if (productError) throw productError;
      if (!productData) throw new Error('Product not found');
      
      // Create the line item
      const { error: createError } = await supabase
        .from('gl_invoice_lines')
        .insert({
          rowid_invoices: invoiceData.glide_row_id,
          rowid_products: productData.glide_row_id,
          renamed_product_name: data.description || productData.display_name,
          qty_sold: data.quantity,
          selling_price: data.unitPrice,
          line_total: data.quantity * data.unitPrice,
          date_of_sale: invoiceData.invoice_order_date
        });
      
      if (createError) throw createError;
      
      toast({
        title: 'Success',
        description: 'Line item added successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoiceId] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add line item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // Update a line item
  const updateLineItem = useCallback(async (id: string, invoiceId: string, data: UpdateLineItemInput): Promise<boolean> => {
    setIsLoading(true);
    try {
      const updateData: any = {};
      
      if (data.description !== undefined) {
        updateData.renamed_product_name = data.description;
      }
      
      if (data.quantity !== undefined) {
        updateData.qty_sold = data.quantity;
      }
      
      if (data.unitPrice !== undefined) {
        updateData.selling_price = data.unitPrice;
      }
      
      // Calculate line total if both quantity and unit price are provided or available
      if (data.quantity !== undefined || data.unitPrice !== undefined) {
        // Get current line item data if needed
        const { data: currentLine, error: fetchError } = await supabase
          .from('gl_invoice_lines')
          .select('qty_sold, selling_price')
          .eq('id', id)
          .single();
        
        if (fetchError) throw fetchError;
        
        const quantity = data.quantity !== undefined ? data.quantity : currentLine.qty_sold;
        const unitPrice = data.unitPrice !== undefined ? data.unitPrice : currentLine.selling_price;
        
        updateData.line_total = quantity * unitPrice;
      }
      
      // Update the line item
      const { error: updateError } = await supabase
        .from('gl_invoice_lines')
        .update(updateData)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Success',
        description: 'Line item updated successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update line item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // Delete a line item
  const deleteLineItem = useCallback(async (id: string, invoiceId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Delete the line item
      const { error: deleteError } = await supabase
        .from('gl_invoice_lines')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: 'Success',
        description: 'Line item deleted successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete line item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // Add a payment
  const addPayment = useCallback(async (data: AddPaymentInput): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get invoice glide_row_id
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('glide_row_id')
        .eq('id', data.invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoiceData) throw new Error('Invoice not found');
      
      // Get account glide_row_id
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('glide_row_id')
        .eq('id', data.accountId)
        .single();
      
      if (accountError) throw accountError;
      if (!accountData) throw new Error('Account not found');
      
      // Create the payment
      const { error: createError } = await supabase
        .from('gl_customer_payments')
        .insert({
          rowid_invoices: invoiceData.glide_row_id,
          rowid_accounts: accountData.glide_row_id,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate.toISOString(),
          type_of_payment: data.paymentMethod,
          payment_note: data.notes
        });
      
      if (createError) throw createError;
      
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // Delete a payment
  const deletePayment = useCallback(async (id: string, invoiceId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Delete the payment
      const { error: deleteError } = await supabase
        .from('gl_customer_payments')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: 'Success',
        description: 'Payment deleted successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, queryClient]);

  // React Query hooks
  const invoicesQuery = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => fetchInvoices(filters),
  });

  const invoiceMutations = {
    createInvoice: useMutation({
      mutationFn: createInvoice,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      },
    }),
    updateInvoice: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) => 
        updateInvoice(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      },
    }),
    deleteInvoice: useMutation({
      mutationFn: deleteInvoice,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      },
    }),
    addLineItem: useMutation({
      mutationFn: addLineItem,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      },
    }),
    updateLineItem: useMutation({
      mutationFn: ({ id, invoiceId, data }: { id: string; invoiceId: string; data: UpdateLineItemInput }) => 
        updateLineItem(id, invoiceId, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      },
    }),
    deleteLineItem: useMutation({
      mutationFn: ({ id, invoiceId }: { id: string; invoiceId: string }) => 
        deleteLineItem(id, invoiceId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      },
    }),
    addPayment: useMutation({
      mutationFn: addPayment,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      },
    }),
    deletePayment: useMutation({
      mutationFn: ({ id, invoiceId }: { id: string; invoiceId: string }) => 
        deletePayment(id, invoiceId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      },
    }),
  };

  return {
    invoices: invoicesQuery.data || [],
    isLoading: isLoading || invoicesQuery.isLoading,
    isError: invoicesQuery.isError,
    error: error || invoicesQuery.error,
    fetchInvoices,
    getInvoice,
    ...invoiceMutations,
  };
};

export const useInvoiceDetail = (id?: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { getInvoice } = useInvoices();
      return getInvoice(id);
    },
    enabled: !!id,
  });
};
