
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useInvoiceDeletion() {
  const queryClient = useQueryClient();

  // Delete an invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('gl_invoices')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return true;
      } catch (err) {
        console.error('Error deleting invoice:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  return {
    deleteInvoice
  };
}
