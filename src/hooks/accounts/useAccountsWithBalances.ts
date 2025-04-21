
import { useQuery } from '@tanstack/react-query';
import { accountService } from '@/services/account-service';
import { handleDatabaseError } from '@/utils/error-handling';

export function useAccountsWithBalances() {
  return useQuery({
    queryKey: ['accounts', 'with-balances'],
    queryFn: async () => {
      try {
        return await accountService.getWithBalances();
      } catch (error) {
        throw handleDatabaseError(error, 'Account', 'read');
      }
    }
  });
}
