
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { InvoiceWithDetails, UpdateInvoiceInput } from '@/types/invoice';

export function useInvoiceMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createInvoice = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: invoice, error: createError } = await supabase
        .from('gl_invoices')
        .insert([data])
        .select()
        .single();
        
      if (createError) throw createError;
      
      toast({
        title: 'Success',
        description: 'Invoice created successfully.',
      });
      
      return invoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating invoice';
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
  };

  const updateInvoice = {
    mutateAsync: async ({ id, ...data }: { id: string } & UpdateInvoiceInput) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: invoice, error: updateError } = await supabase
          .from('gl_invoices')
          .update(data)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        toast({
          title: 'Success',
          description: 'Invoice updated successfully.',
        });
        
        return invoice;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating invoice';
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

  const deleteInvoice = {
    mutateAsync: async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { error: deleteError } = await supabase
          .from('gl_invoices')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        toast({
          title: 'Success',
          description: 'Invoice deleted successfully.',
        });
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting invoice';
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

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    isLoading,
    error
  };
}
