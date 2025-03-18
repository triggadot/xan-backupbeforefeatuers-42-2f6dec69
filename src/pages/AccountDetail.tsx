
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, ReceiptText, ShoppingCart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountForm from '@/components/accounts/AccountForm';
import InvoiceList from '@/components/invoices/InvoiceList';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import { useAccounts } from '@/hooks/useAccounts';
import { useInvoices } from '@/hooks/useInvoices';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/utils/mapping-utils';
import { Account } from '@/types';

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { getAccount, updateAccount, deleteAccount } = useAccounts();
  const { getInvoicesForAccount } = useInvoices();
  const { getPurchaseOrdersForAccount } = usePurchaseOrders();
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const accountData = await getAccount(id);
        if (accountData) {
          setAccount(accountData);
          
          // Fetch related data
          const [invoicesData, purchaseOrdersData] = await Promise.all([
            getInvoicesForAccount(id),
            getPurchaseOrdersForAccount(id)
          ]);
          
          setInvoices(invoicesData);
          setPurchaseOrders(purchaseOrdersData);
        } else {
          setError("Account not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAccountData();
  }, [id, getAccount, getInvoicesForAccount, getPurchaseOrdersForAccount]);

  const handleUpdateAccount = async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => {
    if (!account) return;
    
    setIsSubmitting(true);
    try {
      const updatedAccount = await updateAccount(account.id, data);
      if (updatedAccount) {
        setAccount(updatedAccount);
        setIsEditDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteAccount(account.id);
      if (success) {
        // Redirect to accounts list
        window.location.href = '/accounts';
      }
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="flex items-center mb-8">
          <Link to="/accounts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Accounts
            </Button>
          </Link>
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading account details...</div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="flex items-center mb-8">
          <Link to="/accounts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Accounts
            </Button>
          </Link>
        </div>
        <div className="bg-destructive/10 p-8 rounded-md text-destructive text-center">
          <h3 className="font-medium text-lg mb-2">Error</h3>
          <p>{error || 'Account not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center">
          <Link to="/accounts">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{account.name}</h1>
          <Badge 
            variant={account.status === 'active' ? 'success' : 'destructive'}
            className="ml-4 capitalize"
          >
            {account.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Type</div>
            <div className="text-2xl font-semibold capitalize">{account.type}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Balance</div>
            <div className="text-2xl font-semibold">{formatCurrency(account.balance)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Invoices</div>
            <div className="text-2xl font-semibold">{invoices.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Purchase Orders</div>
            <div className="text-2xl font-semibold">{purchaseOrders.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Email</div>
                      <div>{account.email || "—"}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Phone</div>
                      <div>{account.phone || "—"}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Website</div>
                      <div>{account.website || "—"}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Address</h3>
                  <div className="whitespace-pre-line">{account.address || "No address provided"}</div>
                  
                  <h3 className="font-semibold text-lg mt-6 mb-4">Notes</h3>
                  <div className="whitespace-pre-line">{account.notes || "No notes"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recent Invoices</h3>
                <Link to={`/invoices?accountId=${account.id}`}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              
              {invoices.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">No invoices found</p>
                  <Link to="/invoices/new" className="mt-2 inline-block">
                    <Button size="sm" className="mt-2">
                      <ReceiptText className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              ) : (
                <InvoiceList 
                  invoices={invoices.slice(0, 3)} 
                  isLoading={false} 
                  error={null} 
                />
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recent Purchase Orders</h3>
                <Link to={`/purchase-orders?accountId=${account.id}`}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              
              {purchaseOrders.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">No purchase orders found</p>
                  <Link to="/purchase-orders/new" className="mt-2 inline-block">
                    <Button size="sm" className="mt-2">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Button>
                  </Link>
                </div>
              ) : (
                <PurchaseOrderList 
                  purchaseOrders={purchaseOrders.slice(0, 3)} 
                  isLoading={false} 
                  error={null} 
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="invoices" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Invoices</h3>
            <Link to="/invoices/new">
              <Button>
                <ReceiptText className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
          
          <InvoiceList 
            invoices={invoices} 
            isLoading={false} 
            error={null} 
          />
        </TabsContent>
        
        <TabsContent value="purchase-orders" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Purchase Orders</h3>
            <Link to="/purchase-orders/new">
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Button>
            </Link>
          </div>
          
          <PurchaseOrderList 
            purchaseOrders={purchaseOrders} 
            isLoading={false} 
            error={null} 
          />
        </TabsContent>
      </Tabs>
      
      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <AccountForm 
            defaultValues={account} 
            onSubmit={handleUpdateAccount} 
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDetail;
