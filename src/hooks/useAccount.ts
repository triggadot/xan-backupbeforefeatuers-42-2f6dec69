
import { useState, useEffect } from 'react';
import { Account, AccountRelatedData } from '@/types/accounts';
import { fetchAccountById, fetchAccountRelatedData } from '@/services/accountService';
import { useToast } from '@/hooks/use-toast';

export function useAccount(id: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [relatedData, setRelatedData] = useState<AccountRelatedData | null>(null);
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
        // Fetch account details
        const accountData = await fetchAccountById(id);
        
        if (!accountData) {
          throw new Error('Account not found');
        }
        
        setAccount(accountData);
        
        // Fetch related data
        const related = await fetchAccountRelatedData(id);
        setRelatedData(related);
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

  return { account, relatedData, isLoading, error };
}
