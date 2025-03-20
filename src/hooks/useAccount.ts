
import { useState, useEffect } from 'react';
import { Account } from '@/types/accountNew';
import { fetchAccountById } from '@/services/accountService';

export function useAccount(id: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccount() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAccountById(id);
        setAccount(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccount();
  }, [id]);

  return { account, isLoading, error };
}
