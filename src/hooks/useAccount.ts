
import { useState, useEffect } from 'react';
import { Account } from '@/types';
import { useAccountsNew } from './useAccountsNew';

export function useAccount(id: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccount } = useAccountsNew();

  const fetchAccount = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedAccount = await getAccount(id);
      if (!fetchedAccount) {
        throw new Error('Account not found');
      }
      setAccount(fetchedAccount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  return { account, isLoading, error, fetchAccount };
}
