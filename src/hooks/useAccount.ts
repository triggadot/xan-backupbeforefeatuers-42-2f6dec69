
import { useState, useEffect } from 'react';
import { useAccountsNew } from './useAccountsNew';
import { Account } from '@/types/accountNew';

export function useAccount(id: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccount } = useAccountsNew();

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const accountData = await getAccount(id);
        if (accountData) {
          setAccount(accountData);
        } else {
          setError('Account not found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAccount();
    } else {
      setError('Invalid account ID');
      setIsLoading(false);
    }
  }, [id, getAccount]);

  return { account, isLoading, error };
}
