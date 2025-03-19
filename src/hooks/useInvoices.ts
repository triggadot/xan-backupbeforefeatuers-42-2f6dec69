
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Invoice, InvoiceLine } from '@/types/index';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          gl_accounts!gl_invoices_rowid_accounts_fkey (
            account_name
          ),
          gl_invoice_lines!gl_invoice_lines_rowid_invoices_fkey (
            *,
            gl_products!gl_invoice_lines_rowid_products_fkey (
              *
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Map the database data to our Invoice type
      const formattedInvoices: Invoice[] = data.map(invoice => {
        const invoiceLines: InvoiceLine[] = invoice.gl_invoice_lines?.map((line: any) => ({
          id: line.id,
          productId: line.rowid_products,
          description: line.renamed_product_name || line.gl_products?.display_name || '',
          quantity: line.qty_sold || 0,
          unitPrice: line.selling_price || 0,
          total: line.line_total || 0,
          createdAt: line.created_at,
          updatedAt: line.updated_at,
          productImage: line.gl_products?.product_image1 || '',
        })) || [];

        return {
          id: invoice.id,
          number: invoice.id.slice(0, 8), // Just using a part of the ID as the invoice number
          customerId: invoice.rowid_accounts || '',
          accountName: invoice.gl_accounts?.account_name || '',
          date: new Date(invoice.invoice_order_date || invoice.created_at),
          dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
          status: invoice.payment_status || 'draft',
          total: invoice.total_amount || 0,
          amountPaid: invoice.total_paid || 0,
          balance: invoice.balance || 0,
          notes: invoice.notes || '',
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
          lineItems: invoiceLines,
        };
      });

      setInvoices(formattedInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching invoices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInvoice = useCallback(async (id: string): Promise<Invoice | null> => {
    try {
      setIsLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          gl_accounts!gl_invoices_rowid_accounts_fkey (
            account_name
          ),
          gl_invoice_lines!gl_invoice_lines_rowid_invoices_fkey (
            *,
            gl_products!gl_invoice_lines_rowid_products_fkey (
              *
            )
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) return null;

      // Map the database data to our Invoice type
      const invoiceLines: InvoiceLine[] = data.gl_invoice_lines?.map((line: any) => ({
        id: line.id,
        productId: line.rowid_products,
        description: line.renamed_product_name || line.gl_products?.display_name || '',
        quantity: line.qty_sold || 0,
        unitPrice: line.selling_price || 0,
        total: line.line_total || 0,
        createdAt: line.created_at,
        updatedAt: line.updated_at,
        productImage: line.gl_products?.product_image1 || '',
      })) || [];

      const invoice: Invoice = {
        id: data.id,
        number: data.id.slice(0, 8), // Just using a part of the ID as the invoice number
        customerId: data.rowid_accounts || '',
        accountName: data.gl_accounts?.account_name || '',
        date: new Date(data.invoice_order_date || data.created_at),
        dueDate: data.due_date ? new Date(data.due_date) : null,
        status: data.payment_status || 'draft',
        total: data.total_amount || 0,
        amountPaid: data.total_paid || 0,
        balance: data.balance || 0,
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lineItems: invoiceLines,
      };

      return invoice;
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching the invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addInvoice = useCallback(async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      setError('');

      // Create a random glide_row_id for new records
      const glideRowId = `gl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Map the Invoice object to match database schema
      const dbInvoice = {
        rowid_accounts: newInvoice.customerId,
        invoice_order_date: newInvoice.date.toISOString(),
        payment_status: newInvoice.status,
        total_amount: newInvoice.total,
        total_paid: newInvoice.amountPaid,
        balance: newInvoice.balance,
        notes: newInvoice.notes,
        glide_row_id: glideRowId,
      };

      const { data: invoiceData, error: insertError } = await supabase
        .from('gl_invoices')
        .insert(dbInvoice)
        .select()
        .single();

      if (insertError) throw insertError;

      // Add line items
      if (newInvoice.lineItems && newInvoice.lineItems.length > 0) {
        const dbLineItems = newInvoice.lineItems.map(line => ({
          rowid_invoices: invoiceData.id,
          rowid_products: line.productId,
          renamed_product_name: line.description,
          qty_sold: line.quantity,
          selling_price: line.unitPrice,
          line_total: line.total,
          glide_row_id: `gl-line-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }));

        const { error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .insert(dbLineItems);

        if (lineItemsError) throw lineItemsError;
      }

      toast({
        title: "Invoice Created",
        description: "The invoice has been successfully created",
      });

      await fetchInvoices();
    } catch (err) {
      console.error('Error adding invoice:', err);
      setError(err instanceof Error ? err.message : 'An error occurred adding the invoice');
      
      toast({
        title: "Error Creating Invoice",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    try {
      setIsLoading(true);
      setError('');

      // Map the Invoice updates to match database schema
      const dbUpdates: any = {};
      
      if (updates.customerId) dbUpdates.rowid_accounts = updates.customerId;
      if (updates.date) dbUpdates.invoice_order_date = updates.date.toISOString();
      if (updates.status) dbUpdates.payment_status = updates.status;
      if (updates.total !== undefined) dbUpdates.total_amount = updates.total;
      if (updates.amountPaid !== undefined) dbUpdates.total_paid = updates.amountPaid;
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error: updateError } = await supabase
        .from('gl_invoices')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update line items if provided
      if (updates.lineItems) {
        // First get existing line items
        const { data: existingLines, error: fetchError } = await supabase
          .from('gl_invoice_lines')
          .select('id')
          .eq('rowid_invoices', id);

        if (fetchError) throw fetchError;

        const existingIds = existingLines.map(line => line.id);
        const updateIds = updates.lineItems.filter(line => line.id).map(line => line.id);
        
        // IDs to delete
        const deleteIds = existingIds.filter(id => !updateIds.includes(id));
        
        // Delete removed line items
        if (deleteIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('gl_invoice_lines')
            .delete()
            .in('id', deleteIds);
            
          if (deleteError) throw deleteError;
        }
        
        // Update existing line items
        const existingLines = updates.lineItems.filter(line => line.id);
        for (const line of existingLines) {
          const { error: lineUpdateError } = await supabase
            .from('gl_invoice_lines')
            .update({
              rowid_products: line.productId,
              renamed_product_name: line.description,
              qty_sold: line.quantity,
              selling_price: line.unitPrice,
              line_total: line.total
            })
            .eq('id', line.id);
            
          if (lineUpdateError) throw lineUpdateError;
        }
        
        // Insert new line items
        const newLines = updates.lineItems.filter(line => !line.id);
        if (newLines.length > 0) {
          const dbNewLines = newLines.map(line => ({
            rowid_invoices: id,
            rowid_products: line.productId,
            renamed_product_name: line.description,
            qty_sold: line.quantity,
            selling_price: line.unitPrice,
            line_total: line.total,
            glide_row_id: `gl-line-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          }));
          
          const { error: insertError } = await supabase
            .from('gl_invoice_lines')
            .insert(dbNewLines);
            
          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Invoice Updated",
        description: "The invoice has been successfully updated",
      });

      await fetchInvoices();
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err instanceof Error ? err.message : 'An error occurred updating the invoice');
      
      toast({
        title: "Error Updating Invoice",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError('');

      // First delete line items to maintain referential integrity
      const { error: lineDeleteError } = await supabase
        .from('gl_invoice_lines')
        .delete()
        .eq('rowid_invoices', id);

      if (lineDeleteError) throw lineDeleteError;

      // Then delete the invoice
      const { error: deleteError } = await supabase
        .from('gl_invoices')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted",
      });

      await fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err instanceof Error ? err.message : 'An error occurred deleting the invoice');
      
      toast({
        title: "Error Deleting Invoice",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    getInvoice,
    addInvoice,
    updateInvoice,
    deleteInvoice
  };
}
