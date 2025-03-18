import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '@/types';

interface OtherState {
  // Other state properties would be defined here
  // This is a placeholder to represent other state that might exist
}

interface AccountState {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setAccounts: (accounts: Account[]) => void;
}

// This store interface is now mainly used for non-database backed state
// or temporary state before syncing with database
const useStore = create<AccountState & OtherState>()(
  persist(
    (set) => ({
      // Account state
      accounts: [],
      addAccount: (account) => 
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              ...account,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),
      updateAccount: (id, account) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...account, updatedAt: new Date() } : a
          ),
        })),
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
      setAccounts: (accounts) => set({ accounts }),
    }),
    {
      name: 'app-storage',
    }
  )
);

export { useStore };
