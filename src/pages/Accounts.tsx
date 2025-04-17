
import React, { useState } from 'react';
import { Plus, RefreshCw, UserPlus, Eye, FileText } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';

const Accounts: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
    const newAccount = await createAccount({
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
    
    if (newAccount) {
      // Navigate to the new account's overview page
      navigate(`/account-overview/${newAccount.id}`);
    }
    
    setIsCreateDialogOpen(false);
  };

  const navigateToAccountDetails = (accountId: string, view: 'overview' | 'details') => {
    navigate(view === 'overview' 
      ? `/account-overview/${accountId}` 
      : `/accounts/${accountId}`
    );
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAccounts.map((account) => (
          <div 
            key={account.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{account.name}</h2>
              <Badge 
                variant={account.type === 'Customer' ? 'secondary' : 'outline'}
                className="capitalize"
              >
                {account.type}
              </Badge>
            </div>
            <div className="text-muted-foreground mb-4">
              {account.email || 'No email provided'}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm">Balance</div>
                <div className="font-bold text-lg">
                  {formatCurrency(account.balance || 0)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigateToAccountDetails(account.id, 'overview')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Overview
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigateToAccountDetails(account.id, 'details')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
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
