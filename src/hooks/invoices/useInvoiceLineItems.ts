
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceLineItem } from '@/types/invoice';
import { useToast } from '@/hooks/utils/use-toast';

export function useInvoiceLineItems() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addLineItem = {
    mutateAsync: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<InvoiceLineItem> }): Promise<InvoiceLineItem | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a unique glide_row_id for the line item
        const lineItemGlideId = `INVLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Prepare data for database insert
        const lineItemData = {
          glide_row_id: lineItemGlideId,
          rowid_invoices: invoiceGlideId,
          rowid_products: data.productId,
          renamed_product_name: data.description,
          qty_sold: data.quantity,
          selling_price: data.unitPrice,
          line_total: (data.quantity || 0) * (data.unitPrice || 0),
          product_sale_note: data.notes
        };
        
        const { data: newLineItem, error: createError } = await supabase
          .from('gl_invoice_lines')
          .insert([lineItemData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Update the invoice total
        await updateInvoiceTotal(invoiceGlideId);
        
        toast({
          title: 'Success',
          description: 'Line item added successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: newLineItem.id,
          invoiceId: invoiceGlideId,
          productId: newLineItem.rowid_products || '',
          description: newLineItem.renamed_product_name || '',
          quantity: Number(newLineItem.qty_sold || 0),
          unitPrice: Number(newLineItem.selling_price || 0),
          total: Number(newLineItem.line_total || 0),
          notes: newLineItem.product_sale_note || '',
          createdAt: new Date(newLineItem.created_at),
          updatedAt: new Date(newLineItem.updated_at),
          productName: newLineItem.renamed_product_name || 'Unknown Product'
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error adding line item';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateLineItem = {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<InvoiceLineItem> }): Promise<InvoiceLineItem | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current line item to access the invoice ID
        const { data: currentLineItem, error: fetchError } = await supabase
          .from('gl_invoice_lines')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Prepare data for database update
        const lineItemData: any = {};
        
        if (data.productId !== undefined) lineItemData.rowid_products = data.productId;
        if (data.description !== undefined) lineItemData.renamed_product_name = data.description;
        if (data.quantity !== undefined) lineItemData.qty_sold = data.quantity;
        if (data.unitPrice !== undefined) lineItemData.selling_price = data.unitPrice;
        if (data.notes !== undefined) lineItemData.product_sale_note = data.notes;
        
        // Calculate line total if quantity or price changed
        if (data.quantity !== undefined || data.unitPrice !== undefined) {
          const quantity = data.quantity !== undefined ? data.quantity : Number(currentLineItem.qty_sold);
          const unitPrice = data.unitPrice !== undefined ? data.unitPrice : Number(currentLineItem.selling_price);
          lineItemData.line_total = quantity * unitPrice;
        }
        
        // Update the line item
        const { data: updatedLineItem, error: updateError } = await supabase
          .from('gl_invoice_lines')
          .update(lineItemData)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        // Update the invoice total
        await updateInvoiceTotal(currentLineItem.rowid_invoices);
        
        toast({
          title: 'Success',
          description: 'Line item updated successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: updatedLineItem.id,
          invoiceId: updatedLineItem.rowid_invoices || '',
          productId: updatedLineItem.rowid_products || '',
          description: updatedLineItem.renamed_product_name || '',
          quantity: Number(updatedLineItem.qty_sold || 0),
          unitPrice: Number(updatedLineItem.selling_price || 0),
          total: Number(updatedLineItem.line_total || 0),
          notes: updatedLineItem.product_sale_note || '',
          createdAt: new Date(updatedLineItem.created_at),
          updatedAt: new Date(updatedLineItem.updated_at),
          productName: updatedLineItem.renamed_product_name || 'Unknown Product'
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating line item';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteLineItem = {
    mutateAsync: async ({ id }: { id: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current line item to access the invoice ID
        const { data: lineItem, error: fetchError } = await supabase
          .from('gl_invoice_lines')
          .select('rowid_invoices')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Delete the line item
        const { error: deleteError } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        // Update the invoice total
        await updateInvoiceTotal(lineItem.rowid_invoices);
        
        toast({
          title: 'Success',
          description: 'Line item deleted successfully.',
        });
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting line item';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper function to update invoice totals
  const updateInvoiceTotal = async (invoiceGlideId: string) => {
    try {
      // Calculate total from line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('line_total')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (lineItemsError) throw lineItemsError;
      
      const total = lineItems.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
      
      // Get total payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('payment_amount')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (paymentsError) throw paymentsError;
      
      const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.payment_amount) || 0), 0);
      
      // Update invoice with new totals
      const { error: updateError } = await supabase
        .from('gl_invoices')
        .update({
          total_amount: total,
          total_paid: totalPaid,
          balance: total - totalPaid
        })
        .eq('glide_row_id', invoiceGlideId);
        
      if (updateError) throw updateError;
      
    } catch (err) {
      console.error('Error updating invoice total:', err);
    }
  };

  return {
    addLineItem,
    updateLineItem,
    deleteLineItem,
    isLoading,
    error
  };
}
