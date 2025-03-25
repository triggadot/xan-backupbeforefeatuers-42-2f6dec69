
import { useState, useEffect } from 'react';
import { GlAccount } from '@/types/account';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAccount(id: string) {
  const [account, setAccount] = useState<GlAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadAccount() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) {
          throw fetchError;
        }
        
        setAccount(data);
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to fetch account';
        setError(errorMessage);
        
        toast({
          title: 'Error',
          description: 'Could not load account details',
          variant: 'destructive'
        });
        
        console.error('Error fetching account:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccount();
  }, [id, toast]);

  return { account, isLoading, error };
}
