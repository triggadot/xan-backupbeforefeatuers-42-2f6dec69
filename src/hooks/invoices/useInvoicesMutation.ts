
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreateInvoiceInput, UpdateInvoiceInput } from '@/types/invoice';

export function useInvoicesMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceInput): Promise<string> => {
      try {
        // Create the invoice
        const { data: invoice, error } = await supabase
          .from('gl_invoices')
          .insert({
            glide_row_id: `INV-${Date.now()}`,
            rowid_accounts: data.customerId,
            invoice_order_date: data.invoiceDate.toISOString(),
            due_date: data.dueDate ? data.dueDate.toISOString() : null,
            payment_status: data.status,
            notes: data.notes || '',
          })
          .select('id, glide_row_id')
          .single();

        if (error) throw error;

        // Create the line items
        const lineItems = data.lineItems.map(item => ({
          glide_row_id: `INVLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          rowid_invoices: invoice.glide_row_id,
          rowid_products: item.productId,
          renamed_product_name: item.description,
          qty_sold: item.quantity,
          selling_price: item.unitPrice,
          line_total: item.quantity * item.unitPrice,
        }));

        const { error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .insert(lineItems);

        if (lineItemsError) throw lineItemsError;

        toast({
          title: 'Invoice Created',
          description: 'Your invoice has been created successfully.',
        });

        return invoice.id;
      } catch (err) {
        console.error('Error creating invoice:', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to create invoice',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateInvoiceInput }): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('gl_invoices')
          .update({
            rowid_accounts: data.customerId,
            invoice_order_date: data.invoiceDate.toISOString(),
            due_date: data.dueDate ? data.dueDate.toISOString() : null,
            payment_status: data.status,
            notes: data.notes || '',
          })
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Invoice Updated',
          description: 'Your invoice has been updated successfully.',
        });

        return true;
      } catch (err) {
        console.error('Error updating invoice:', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to update invoice',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });

  return {
    createInvoice,
    updateInvoice
  };
}
