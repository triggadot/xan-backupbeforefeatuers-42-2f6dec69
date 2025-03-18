
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Clock, Mail, Phone } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DataTable from '@/components/common/DataTable';
import { useStore } from '@/store';
import { Account } from '@/types';
import { cn } from '@/lib/utils';

const Accounts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: 'customer',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
    status: 'active',
    balance: 0,
  });
  
  const accounts = useStore((state) => state.accounts);
  const addAccount = useStore((state) => state.addAccount);
  const updateAccount = useStore((state) => state.updateAccount);
  const deleteAccount = useStore((state) => state.deleteAccount);
  
  const handleCreateClick = () => {
    setCurrentAccount(null);
    setFormData({
      name: '',
      type: 'customer',
      email: '',
      phone: '',
      address: '',
      website: '',
      notes: '',
      status: 'active',
      balance: 0,
    });
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (account: Account) => {
    setCurrentAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      email: account.email,
      phone: account.phone,
      address: account.address,
      website: account.website,
      notes: account.notes,
      status: account.status,
      balance: account.balance,
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (account: Account) => {
    setCurrentAccount(account);
    setIsDeleteDialogOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'balance' ? parseFloat(value) : value,
    }));
  };
  
  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as 'customer' | 'vendor' | 'both',
    }));
  };
  
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as 'active' | 'inactive',
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name and email address.',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentAccount) {
      // Update existing account
      updateAccount(currentAccount.id, formData);
      toast({
        title: 'Account Updated',
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new account
      addAccount(formData as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>);
      toast({
        title: 'Account Created',
        description: `${formData.name} has been added successfully.`,
      });
    }
    
    setIsDialogOpen(false);
  };
  
  const handleDelete = () => {
    if (currentAccount) {
      deleteAccount(currentAccount.id);
      toast({
        title: 'Account Deleted',
        description: `${currentAccount.name} has been deleted.`,
      });
      setIsDeleteDialogOpen(false);
    }
  };
  
  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: (row: Account) => (
        <div className="flex items-center gap-2">
          {row.name}
          {row.status === 'active' && (
            <BadgeCheck className="h-4 w-4 text-green-500" />
          )}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: (row: Account) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.type === 'customer' ? 'bg-blue-100 text-blue-800' : 
          row.type === 'vendor' ? 'bg-purple-100 text-purple-800' : 
          'bg-gray-100 text-gray-800'
        )}>
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: (row: Account) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.email}
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row: Account) => (
        row.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {row.phone}
          </div>
        ) : null
      ),
    },
    {
      id: 'balance',
      header: 'Balance',
      accessorKey: 'balance',
      cell: (row: Account) => (
        <span className={cn(
          'font-medium',
          row.balance > 0 ? 'text-green-600' : 
          row.balance < 0 ? 'text-red-600' : 
          'text-gray-600'
        )}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(row.balance)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row: Account) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={
            row.status === 'active' ? 'text-green-600' : 'text-red-600'
          }>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </div>
      ),
    },
  ];
  
  return (
    <div>
      <DataTable
        data={accounts}
        columns={columns}
        title="Accounts"
        searchPlaceholder="Search accounts..."
        createButtonLabel="Add Account"
        onCreateClick={handleCreateClick}
        onRowClick={(account) => navigate(`/accounts/${account.id}`)}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentAccount ? 'Edit Account' : 'Create New Account'}</DialogTitle>
            <DialogDescription>
              {currentAccount 
                ? 'Update the account details below.' 
                : 'Fill in the account details below.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance">Balance</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentAccount?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
