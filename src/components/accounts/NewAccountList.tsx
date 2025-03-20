
import React from 'react';
import { Account } from '@/types';
import NewAccountCard from './NewAccountCard';
import { Spinner } from '@/components/ui/spinner';

interface AccountListProps {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

const NewAccountList: React.FC<AccountListProps> = ({ accounts, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="font-medium text-lg mb-2">No accounts found</h3>
        <p className="text-muted-foreground">Create your first account to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <NewAccountCard key={account.id} account={account} />
      ))}
    </div>
  );
};

export default NewAccountList;
