import React, { useState } from 'react';
import { Plus, RefreshCw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import AccountCardList from '@/components/accounts/AccountCardList';
import AccountForm from '@/components/accounts/AccountForm';
import { useAccountMutation } from '@/hooks/accounts';
import { useAccountsWithBalances } from '@/hooks/accounts/useAccountsWithBalances';
import { Account } from '@/types/accountNew';
import { AccountFormData } from '@/types/accounts';

const Accounts: React.FC = () => {
  const queryClient = useQueryClient();
  const { accounts = [], isLoading, error } = useAccountsWithBalances();
  const { createAccount, isCreating } = useAccountMutation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (account.type && account.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddAccount = async (data: AccountFormData) => {
    createAccount({
      account_name: data.name,
      client_type: data.type,
      email_of_who_added: data.email,
      phone: data.phone,
      address: data.address,
      website: data.website,
      notes: data.notes,
      status: 'active',
      balance: 0,
      accounts_uid: `${data.type}_${Date.now()}`,
    });
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-full sm:w-64"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>
      
      <AccountCardList 
        accounts={filteredAccounts} 
        isLoading={isLoading} 
        error={error} 
      />
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <AccountForm onSubmit={handleAddAccount} isSubmitting={isCreating} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
