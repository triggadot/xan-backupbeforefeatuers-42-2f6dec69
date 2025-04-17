
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Estimate } from '@/types/estimates/estimate';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Helper function to ensure status is a valid enum value
const validateStatus = (status: string): 'pending' | 'draft' | 'converted' => {
  if (status === 'pending' || status === 'draft' || status === 'converted') {
    return status;
  }
  return 'draft'; // Default fallback
};

// Helper function to convert Date objects to ISO strings
const convertDatesToISOString = (data: any): any => {
  if (!data) return data;

  const result = { ...data };

  // Convert Date objects to strings
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  });

  return result;
};

export function useEstimateMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEstimate = useMutation({
    mutationFn: async (data: Partial<Estimate>): Promise<Estimate> => {
      try {
        // Create a unique glide_row_id if not provided
        const glideRowId = data.glide_row_id || `EST-${Date.now()}`;

        // Ensure status is a valid enum value
        const validStatus = validateStatus(data.status || 'draft');

        // Convert Date objects to strings and prepare data
        const convertedData = convertDatesToISOString(data);

        const estimateData = {
          ...convertedData,
          glide_row_id: glideRowId,
          status: validStatus,
          total_amount: data.total_amount || 0,
          total_credits: data.total_credits || 0,
          balance: data.balance || 0
        };

        const { data: result, error } = await supabase
          .from('gl_estimates')
          .insert([estimateData])
          .select()
          .single();

        if (error) throw error;

        // Construct a valid Estimate object
        const newEstimate: Estimate = {
          id: result.id,
          glide_row_id: result.glide_row_id,
          rowid_accounts: result.rowid_accounts,
          rowid_invoices: result.rowid_invoices,
          estimate_date: result.estimate_date,
          is_a_sample: result.is_a_sample,
          add_note: result.add_note,
          status: validateStatus(result.status),
          total_amount: Number(result.total_amount),
          total_credits: Number(result.total_credits),
          balance: Number(result.balance),
          glide_pdf_url: result.glide_pdf_url,
          glide_pdf_url2: result.glide_pdf_url2,
          valid_final_create_invoice_clicked: result.valid_final_create_invoice_clicked,
          date_invoice_created_date: result.date_invoice_created_date,
          created_at: result.created_at,
          updated_at: result.updated_at
        };

        toast({
          title: 'Success',
          description: 'Estimate created successfully',
        });

        return newEstimate;
      } catch (err) {
        console.error('Error creating estimate:', err);
        toast({
          title: 'Error',
          description: 'Failed to create estimate',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    }
  });

  const updateEstimate = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Estimate>): Promise<Estimate> => {
      try {
        // Ensure status is a valid enum value if included
        const updateData = { ...data };
        if (updateData.status) {
          updateData.status = validateStatus(updateData.status);
        }

        // Convert Date objects to strings
        const convertedData = convertDatesToISOString(updateData);

        const { data: result, error } = await supabase
          .from('gl_estimates')
          .update(convertedData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Construct a valid Estimate object
        const updatedEstimate: Estimate = {
          id: result.id,
          glide_row_id: result.glide_row_id,
          rowid_accounts: result.rowid_accounts,
          rowid_invoices: result.rowid_invoices,
          estimate_date: result.estimate_date,
          is_a_sample: result.is_a_sample,
          add_note: result.add_note,
          status: validateStatus(result.status),
          total_amount: Number(result.total_amount),
          total_credits: Number(result.total_credits),
          balance: Number(result.balance),
          glide_pdf_url: result.glide_pdf_url,
          glide_pdf_url2: result.glide_pdf_url2,
          valid_final_create_invoice_clicked: result.valid_final_create_invoice_clicked,
          date_invoice_created_date: result.date_invoice_created_date,
          created_at: result.created_at,
          updated_at: result.updated_at
        };

        toast({
          title: 'Success',
          description: 'Estimate updated successfully',
        });

        return updatedEstimate;
      } catch (err) {
        console.error('Error updating estimate:', err);
        toast({
          title: 'Error',
          description: 'Failed to update estimate',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  const deleteEstimate = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('gl_estimates')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Estimate deleted successfully',
        });

        return true;
      } catch (err) {
        console.error('Error deleting estimate:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete estimate',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    }
  });

  const convertToInvoice = useMutation({
    mutationFn: async (id: string): Promise<any> => {
      try {
        // Get the estimate details
        const { data: estimate, error: estimateError } = await supabase
          .from('gl_estimates')
          .select('*')
          .eq('id', id)
          .single();

        if (estimateError) throw estimateError;

        // Create a new invoice ID
        const invoiceGlideId = `INV-${Date.now()}`;

        // Create the invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('gl_invoices')
          .insert({
            glide_row_id: invoiceGlideId,
            rowid_accounts: estimate.rowid_accounts,
            date_of_invoiceew Date().toISOString(),
            notes: 'Converted from estimate #' + estimate.glide_row_id,
            payment_status: 'draft',
            processed: false
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Get estimate line items
        const { data: estimateLines, error: linesError } = await supabase
          .from('gl_estimate_lines')
          .select('*')
          .eq('rowid_estimates', estimate.glide_row_id);

        if (linesError) throw linesError;

        // Add line items to the invoice
        if (estimateLines && estimateLines.length > 0) {
          const invoiceLines = estimateLines.map(line => ({
            glide_row_id: `INVLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            rowid_invoices: invoiceGlideId,
            rowid_products: line.rowid_products,
            renamed_product_name: line.sale_product_name,
            qty_sold: line.qty_sold,
            selling_price: line.selling_price,
            line_total: line.line_total,
            product_sale_note: line.product_sale_note
          }));

          const { error: insertLinesError } = await supabase
            .from('gl_invoice_lines')
            .insert(invoiceLines);

          if (insertLinesError) throw insertLinesError;
        }

        // Update the estimate status to converted and link to the invoice
        const { error: updateError } = await supabase
          .from('gl_estimates')
          .update({
            status: 'converted',
            rowid_invoices: invoiceGlideId
          })
          .eq('id', id);

        if (updateError) throw updateError;

        toast({
          title: 'Success',
          description: 'Estimate converted to invoice successfully',
        });

        return { invoiceId: invoice.id, invoiceGlideId };
      } catch (err) {
        console.error('Error converting estimate to invoice:', err);
        toast({
          title: 'Error',
          description: 'Failed to convert estimate to invoice',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  return {
    createEstimate,
    updateEstimate,
    deleteEstimate,
    convertToInvoice
  };
}
