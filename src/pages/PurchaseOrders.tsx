import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useAccounts } from '@/hooks/useAccounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PurchaseOrder } from '../types/purchaseOrder';

const PurchaseOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { purchaseOrders, isLoading, error, fetchPurchaseOrders } = usePurchaseOrders();
  const { accounts, fetchAccounts } = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    // Initialize filters from URL params
    const accountId = searchParams.get('accountId');
    if (accountId) {
      setSelectedAccount(accountId);
    }
    
    const status = searchParams.get('status');
    if (status) {
      setSelectedStatus(status);
    }
    
    // Fetch data
    fetchPurchaseOrders();
    fetchAccounts();
  }, [searchParams, fetchPurchaseOrders, fetchAccounts]);

  // Apply filters
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = searchTerm === '' || 
      po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.accountName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || po.status === selectedStatus;
    
    const matchesAccount = !selectedAccount || po.vendorId === selectedAccount;
    
    return matchesSearch && matchesStatus && matchesAccount;
  });

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value) {
      searchParams.set('status', value);
    } else {
      searchParams.delete('status');
    }
    setSearchParams(searchParams);
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    if (value) {
      searchParams.set('accountId', value);
    } else {
      searchParams.delete('accountId');
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedAccount('');
    setSearchParams({});
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <Button onClick={() => fetchPurchaseOrders()} disabled={isLoading} variant="outline" size="icon">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative w-full">
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedAccount} onValueChange={handleAccountChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(selectedStatus || selectedAccount || searchTerm) && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      <PurchaseOrderList 
        purchaseOrders={filteredPurchaseOrders} 
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );
};

export default PurchaseOrders;
