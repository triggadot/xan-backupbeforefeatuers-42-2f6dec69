
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  InvoiceListItem, 
  InvoiceWithDetails, 
  CreateInvoiceInput, 
  UpdateInvoiceInput,
  InvoiceFilters
} from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

export function useInvoicesNew(filters?: InvoiceFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices from materialized view
  const { 
    data: invoices, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['invoicesNew', filters],
    queryFn: async () => {
      setError(null);
      
      let query = supabase
        .from('mv_invoice_customer_details')
        .select();

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.customerId) {
          query = query.eq('rowid_accounts', filters.customerId);
        }
        
        if (filters.dateFrom) {
          query = query.gte('invoice_order_date', filters.dateFrom.toISOString());
        }
        
        if (filters.dateTo) {
          query = query.lte('invoice_order_date', filters.dateTo.toISOString());
        }

        if (filters.search) {
          query = query.or(`customer_name.ilike.%${filters.search}%,glide_row_id.ilike.%${filters.search}%`);
        }
      }
      
      // Always order by invoice date
      query = query.order('invoice_order_date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      return data.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.glide_row_id?.substring(4) || 'Unknown',
        glideRowId: invoice.glide_row_id || '',
        customerId: invoice.rowid_accounts || '',
        customerName: invoice.customer_name || 'Unknown Customer',
        date: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        total: Number(invoice.total_amount || 0),
        balance: Number(invoice.balance || 0),
        status: invoice.payment_status || 'draft',
        lineItemsCount: Number(invoice.line_items_count || 0)
      }));
    }
  });

  // Get a single invoice with all details
  const getInvoice = useCallback(async (id: string): Promise<InvoiceWithDetails | null> => {
    try {
      // Get invoice from materialized view
      const { data: invoice, error } = await supabase
        .from('mv_invoice_customer_details')
        .select()
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!invoice) return null;
      
      // Get line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          id,
          glide_row_id,
          renamed_product_name,
          qty_sold,
          selling_price,
          line_total,
          product_sale_note,
          rowid_products,
          gl_products (
            id,
            glide_row_id,
            vendor_product_name,
            new_product_name,
            cost,
            category,
            product_image1
          )
        `)
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (lineItemsError) throw lineItemsError;
      
      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select()
        .eq('rowid_invoices', invoice.glide_row_id)
        .order('date_of_payment', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      // Map to InvoiceWithDetails
      return {
        id: invoice.id,
        invoiceNumber: invoice.glide_row_id?.substring(4) || 'Unknown',
        glideRowId: invoice.glide_row_id || '',
        customerId: invoice.rowid_accounts || '',
        customerName: invoice.customer_name || 'Unknown Customer',
        invoiceDate: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        status: invoice.payment_status || 'draft',
        subtotal: Number(invoice.total_amount || 0),
        taxRate: invoice.tax_rate !== undefined ? Number(invoice.tax_rate) : undefined,
        taxAmount: invoice.tax_amount !== undefined ? Number(invoice.tax_amount) : undefined,
        total: Number(invoice.total_amount || 0),
        amountPaid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        notes: invoice.notes || '',
        lineItems: lineItems?.map(item => ({
          id: item.id,
          productId: item.rowid_products || '',
          description: item.product_sale_note || '',
          productName: item.renamed_product_name || 'Unknown Product',
          quantity: Number(item.qty_sold || 0),
          unitPrice: Number(item.selling_price || 0),
          total: Number(item.line_total || 0),
          productDetails: item.gl_products ? {
            id: item.gl_products.id,
            glide_row_id: item.gl_products.glide_row_id,
            name: item.gl_products.new_product_name || item.gl_products.vendor_product_name || 'Unknown',
            display_name: item.gl_products.new_product_name,
            vendor_product_name: item.gl_products.vendor_product_name,
            new_product_name: item.gl_products.new_product_name,
            cost: item.gl_products.cost,
            category: item.gl_products.category,
            product_image1: item.gl_products.product_image1
          } : undefined
        })) || [],
        payments: payments?.map(payment => ({
          id: payment.id,
          date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
          amount: Number(payment.payment_amount || 0),
          method: payment.type_of_payment || undefined,
          notes: payment.payment_note || undefined
        })) || []
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }, []);

  // Create Invoice
  const createInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceInput): Promise<string> => {
      try {
        // Find account glide_row_id from id
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .eq('id', data.customerId)
          .single();
          
        if (accountError) throw accountError;
        
        // Create a unique ID for glide_row_id
        const glideRowId = `INV-${Date.now()}`;
        
        // Insert the invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('gl_invoices')
          .insert({
            glide_row_id: glideRowId,
            rowid_accounts: account.glide_row_id,
            invoice_order_date: data.invoiceDate.toISOString(),
            due_date: data.dueDate?.toISOString(),
            processed: data.status === 'sent',
            payment_status: data.status,
            notes: data.notes,
            total_amount: 0,
            total_paid: 0,
            balance: 0
          })
          .select()
          .single();
          
        if (invoiceError) throw invoiceError;
        
        // Insert line items
        if (data.lineItems && data.lineItems.length > 0) {
          const lineItems = data.lineItems.map(item => {
            const total = Number(item.quantity) * Number(item.unitPrice);
            return {
              glide_row_id: `INVL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              rowid_invoices: glideRowId,
              rowid_products: item.productId,
              renamed_product_name: item.description,
              qty_sold: item.quantity,
              selling_price: item.unitPrice,
              line_total: total,
              product_sale_note: item.description
            };
          });
          
          const { error: lineItemsError } = await supabase
            .from('gl_invoice_lines')
            .insert(lineItems);
            
          if (lineItemsError) throw lineItemsError;
        }
        
        // Update invoice total
        await updateInvoiceTotals(glideRowId);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        
        return invoice.id;
      } catch (error) {
        console.error('Error creating invoice:', error);
        toast({
          title: "Error creating invoice",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Invoice created",
        description: "Invoice has been created successfully.",
      });
    }
  });

  // Update Invoice
  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateInvoiceInput }): Promise<void> => {
      try {
        // Get current invoice to get glide_row_id
        const { data: currentInvoice, error: currentInvoiceError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', id)
          .single();
          
        if (currentInvoiceError) throw currentInvoiceError;
        
        // Find account glide_row_id from id if customerId is being updated
        let accountGlideRowId;
        
        if (data.customerId) {
          const { data: account, error: accountError } = await supabase
            .from('gl_accounts')
            .select('glide_row_id')
            .eq('id', data.customerId)
            .single();
            
          if (accountError) throw accountError;
          accountGlideRowId = account.glide_row_id;
        }
        
        // Prepare update data
        const updateData: any = {};
        
        if (accountGlideRowId) updateData.rowid_accounts = accountGlideRowId;
        if (data.invoiceDate) updateData.invoice_order_date = data.invoiceDate.toISOString();
        if (data.dueDate !== undefined) updateData.due_date = data.dueDate ? data.dueDate.toISOString() : null;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status) {
          updateData.payment_status = data.status;
          updateData.processed = data.status !== 'draft';
        }
        
        // Update the invoice
        const { error: updateError } = await supabase
          .from('gl_invoices')
          .update(updateData)
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        // Update invoice totals
        await updateInvoiceTotals(currentInvoice.glide_row_id);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        queryClient.invalidateQueries({ queryKey: ['invoiceNew', id] });
      } catch (error) {
        console.error('Error updating invoice:', error);
        toast({
          title: "Error updating invoice",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Invoice updated",
        description: "Invoice has been updated successfully.",
      });
    }
  });

  // Delete Invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        // Get glide_row_id of invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('gl_invoices')
          .select('glide_row_id')
          .eq('id', id)
          .single();
          
        if (invoiceError) throw invoiceError;
        
        // Delete line items first (maintain referential integrity)
        const { error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (lineItemsError) throw lineItemsError;
        
        // Delete payments
        const { error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (paymentsError) throw paymentsError;
        
        // Delete the invoice
        const { error: deleteError } = await supabase
          .from('gl_invoices')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast({
          title: "Error deleting invoice",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully.",
      });
    }
  });

  // Add Payment
  const addPayment = useMutation({
    mutationFn: async ({ invoiceId, glideRowId, accountGlideRowId, amount, date, method, notes }: { 
      invoiceId: string,
      glideRowId: string,
      accountGlideRowId: string,
      amount: number,
      date?: Date,
      method?: string,
      notes?: string
    }): Promise<void> => {
      try {
        // Create a new payment
        const { error: paymentError } = await supabase
          .from('gl_customer_payments')
          .insert({
            glide_row_id: `INVP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            rowid_invoices: glideRowId,
            rowid_accounts: accountGlideRowId,
            payment_amount: amount,
            date_of_payment: date?.toISOString() || new Date().toISOString(),
            type_of_payment: method,
            payment_note: notes
          });
          
        if (paymentError) throw paymentError;
        
        // Update invoice totals
        await updateInvoiceTotals(glideRowId);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        queryClient.invalidateQueries({ queryKey: ['invoiceNew', invoiceId] });
      } catch (error) {
        console.error('Error adding payment:', error);
        toast({
          title: "Error adding payment",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Payment added",
        description: "Payment has been added successfully.",
      });
    }
  });

  // Delete Payment
  const deletePayment = useMutation({
    mutationFn: async ({ paymentId, invoiceId, glideRowId }: { 
      paymentId: string,
      invoiceId: string,
      glideRowId: string 
    }): Promise<void> => {
      try {
        // Delete the payment
        const { error: deleteError } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('id', paymentId);
          
        if (deleteError) throw deleteError;
        
        // Update invoice totals
        await updateInvoiceTotals(glideRowId);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        queryClient.invalidateQueries({ queryKey: ['invoiceNew', invoiceId] });
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast({
          title: "Error deleting payment",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Payment deleted",
        description: "Payment has been deleted successfully.",
      });
    }
  });

  // Add Line Item
  const addLineItem = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      glideRowId, 
      productId, 
      description, 
      quantity, 
      price 
    }: {
      invoiceId: string,
      glideRowId: string,
      productId: string,
      description: string,
      quantity: number,
      price: number
    }): Promise<void> => {
      try {
        const total = quantity * price;
        
        // Add the line item
        const { error: lineItemError } = await supabase
          .from('gl_invoice_lines')
          .insert({
            glide_row_id: `INVL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            rowid_invoices: glideRowId,
            rowid_products: productId,
            renamed_product_name: description,
            qty_sold: quantity,
            selling_price: price,
            line_total: total,
            product_sale_note: description
          });
          
        if (lineItemError) throw lineItemError;
        
        // Update invoice totals
        await updateInvoiceTotals(glideRowId);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        queryClient.invalidateQueries({ queryKey: ['invoiceNew', invoiceId] });
      } catch (error) {
        console.error('Error adding line item:', error);
        toast({
          title: "Error adding line item",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Line item added",
        description: "Line item has been added successfully.",
      });
    }
  });

  // Update Line Item
  const updateLineItem = useMutation({
    mutationFn: async ({ 
      lineItemId, 
      invoiceId, 
      glideRowId, 
      description, 
      quantity, 
      price 
    }: {
      lineItemId: string,
      invoiceId: string,
      glideRowId: string,
      description?: string,
      quantity?: number,
      price?: number
    }): Promise<void> => {
      try {
        // Get current line item data
        const { data: lineItem, error: getLineItemError } = await supabase
          .from('gl_invoice_lines')
          .select('qty_sold, selling_price')
          .eq('id', lineItemId)
          .single();
          
        if (getLineItemError) throw getLineItemError;
        
        // Prepare update data
        const updateData: any = {};
        
        if (description !== undefined) updateData.renamed_product_name = description;
        if (description !== undefined) updateData.product_sale_note = description;
        
        const qty = quantity !== undefined ? quantity : lineItem.qty_sold;
        const unitPrice = price !== undefined ? price : lineItem.selling_price;
        
        if (quantity !== undefined) updateData.qty_sold = qty;
        if (price !== undefined) updateData.selling_price = unitPrice;
        
        updateData.line_total = qty * unitPrice;
        
        // Update the line item
        const { error: updateError } = await supabase
          .from('gl_invoice_lines')
          .update(updateData)
          .eq('id', lineItemId);
          
        if (updateError) throw updateError;
        
        // Update invoice totals
        await updateInvoiceTotals(glideRowId);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        queryClient.invalidateQueries({ queryKey: ['invoiceNew', invoiceId] });
      } catch (error) {
        console.error('Error updating line item:', error);
        toast({
          title: "Error updating line item",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Line item updated",
        description: "Line item has been updated successfully.",
      });
    }
  });

  // Delete Line Item
  const deleteLineItem = useMutation({
    mutationFn: async ({ 
      lineItemId, 
      invoiceId, 
      glideRowId 
    }: {
      lineItemId: string,
      invoiceId: string,
      glideRowId: string
    }): Promise<void> => {
      try {
        // Delete the line item
        const { error: deleteError } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('id', lineItemId);
          
        if (deleteError) throw deleteError;
        
        // Update invoice totals
        await updateInvoiceTotals(glideRowId);
        
        // Refresh the query to update the list
        queryClient.invalidateQueries({ queryKey: ['invoicesNew'] });
        queryClient.invalidateQueries({ queryKey: ['invoiceNew', invoiceId] });
      } catch (error) {
        console.error('Error deleting line item:', error);
        toast({
          title: "Error deleting line item",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Line item deleted",
        description: "Line item has been deleted successfully.",
      });
    }
  });

  // Helper function to update invoice totals
  const updateInvoiceTotals = async (glideRowId: string): Promise<void> => {
    try {
      // Calculate total from line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('line_total')
        .eq('rowid_invoices', glideRowId);
        
      if (lineItemsError) throw lineItemsError;
      
      const total = lineItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
      
      // Calculate total paid from payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('payment_amount')
        .eq('rowid_invoices', glideRowId);
        
      if (paymentsError) throw paymentsError;
      
      const totalPaid = payments.reduce((sum, item) => sum + Number(item.payment_amount || 0), 0);
      
      // Calculate balance
      const balance = total - totalPaid;
      
      // Determine payment status
      let paymentStatus = 'draft';
      if (total > 0) {
        if (totalPaid >= total) {
          paymentStatus = 'paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'partial';
        } else {
          paymentStatus = 'sent';
        }
      }
      
      // Update the invoice
      const { error: updateError } = await supabase
        .from('gl_invoices')
        .update({
          total_amount: total,
          total_paid: totalPaid,
          balance: balance,
          payment_status: paymentStatus
        })
        .eq('glide_row_id', glideRowId);
        
      if (updateError) throw updateError;

      // Refresh materialized view
      const { error: refreshError } = await supabase.rpc('refresh_materialized_view', {
        view_name: 'mv_invoice_customer_details'
      });

      if (refreshError) {
        console.error('Error refreshing materialized view:', refreshError);
      }
      
    } catch (error) {
      console.error('Error updating invoice totals:', error);
      throw error;
    }
  };

  return {
    invoices: invoices || [],
    isLoading,
    error,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    deletePayment,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    refetch
  };
}
