
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Edit, Trash2, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency, formatDate, formatPhoneNumber } from '@/utils/format-utils';
import { Spinner } from '@/components/ui/spinner';
import { useInvoices } from '@/hooks/invoices/useInvoices';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import InvoiceList from '@/components/invoices/InvoiceList';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import { Account } from '@/types/account';
import { useToast } from '@/hooks/use-toast';

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  
  const { accounts, getAccount, deleteAccount } = useAccounts();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get related invoices for this account
  const { getInvoicesForAccount } = useInvoices();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  
  // Get related purchase orders for this account
  const { getPurchaseOrdersForVendor } = usePurchaseOrders({});
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoadingPurchaseOrders, setIsLoadingPurchaseOrders] = useState(false);

  useEffect(() => {
    if (id) {
      loadAccountDetails(id);
    }
  }, [id]);

  const loadAccountDetails = async (accountId: string) => {
    setIsLoading(true);
    try {
      const accountData = await getAccount(accountId);
      if (accountData) {
        setAccount(accountData);
        
        // Load related data based on account type
        if (accountData.is_customer) {
          loadInvoices(accountId);
        }
        
        if (accountData.is_vendor) {
          loadPurchaseOrders(accountId);
        }
      }
    } catch (error) {
      console.error('Error loading account:', error);
      toast({
        title: 'Error',
        description: 'Failed to load account details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoices = async (accountId: string) => {
    setIsLoadingInvoices(true);
    try {
      const invoicesData = await getInvoicesForAccount(accountId);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const loadPurchaseOrders = async (accountId: string) => {
    setIsLoadingPurchaseOrders(true);
    try {
      const purchaseOrdersData = await getPurchaseOrdersForVendor(accountId);
      setPurchaseOrders(purchaseOrdersData || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setIsLoadingPurchaseOrders(false);
    }
  };

  const handleDelete = async () => {
    if (!account?.id) return;
    
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await deleteAccount(account.id);
        toast({
          title: 'Success',
          description: 'Account deleted successfully',
        });
        navigate('/accounts');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete account',
          variant: 'destructive',
        });
      }
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleViewPurchaseOrder = (poId: string) => {
    navigate(`/purchase-orders/${poId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container py-6 flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!account) {
    return (
      <div className="container py-6">
        <div className="bg-destructive/10 p-6 rounded-md text-destructive text-center">
          <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
          <p>The account you're looking for doesn't exist or was removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Accounts
          </Button>
        </div>
      </div>
    );
  }

  // Determine if this account is a customer, vendor, or both
  const isCustomer = account.is_customer;
  const isVendor = account.is_vendor;
  const accountType = isCustomer && isVendor 
    ? 'Customer & Vendor' 
    : isCustomer 
      ? 'Customer' 
      : isVendor 
        ? 'Vendor' 
        : 'Unknown';

  return (
    <div className="container py-6 space-y-6 animate-enter-bottom">
      <Helmet>
        <title>{account.account_name || 'Account'} | Billow</title>
      </Helmet>
      
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Accounts
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/accounts/edit/${account.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">{account.account_name}</CardTitle>
                <CardDescription>
                  {account.accounts_uid ? `ID: ${account.accounts_uid} • ` : ''}
                  {accountType}
                </CardDescription>
              </div>
              {accountType === 'Customer' && (
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <User className="h-5 w-5" />
                </div>
              )}
              {accountType === 'Vendor' && (
                <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                  <Building className="h-5 w-5" />
                </div>
              )}
              {accountType === 'Customer & Vendor' && (
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <div className="relative">
                    <User className="h-5 w-5" />
                    <Building className="h-3 w-3 absolute -bottom-1 -right-1" />
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                {isCustomer && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
                {isVendor && <TabsTrigger value="purchaseOrders">Purchase Orders</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="details" className="p-4 space-y-6">
                <div>
                  <h3 className="font-medium text-muted-foreground mb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {account.email_of_who_added && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{account.email_of_who_added}</p>
                      </div>
                    )}
                    
                    {account.date_added_client && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date Added</p>
                        <p className="font-medium">{formatDate(account.date_added_client)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {isCustomer && (
                <TabsContent value="invoices" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">Invoices</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/invoices/new', { state: { accountId: account.id } })}>
                      Create Invoice
                    </Button>
                  </div>
                  
                  <InvoiceList 
                    invoices={invoices}
                    isLoading={isLoadingInvoices}
                    error={null}
                    onView={handleViewInvoice}
                  />
                </TabsContent>
              )}
              
              {isVendor && (
                <TabsContent value="purchaseOrders" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">Purchase Orders</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/purchase-orders/new', { state: { accountId: account.id } })}>
                      Create Purchase Order
                    </Button>
                  </div>
                  
                  <PurchaseOrderList 
                    purchaseOrders={purchaseOrders}
                    isLoading={isLoadingPurchaseOrders}
                    error={null}
                    onView={handleViewPurchaseOrder}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
          
          <CardFooter className="text-sm text-muted-foreground">
            Last updated: {formatDate(account.updated_at || new Date().toISOString())}
          </CardFooter>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCustomer && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                    <p className="text-xl font-semibold">{invoices.length || 0}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-xl font-semibold">{formatCurrency(
                      invoices.reduce((sum, invoice) => sum + (invoice.balance || 0), 0)
                    )}</p>
                  </div>
                </>
              )}
              
              {isVendor && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Purchase Orders</p>
                    <p className="text-xl font-semibold">{purchaseOrders.length || 0}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-xl font-semibold">{formatCurrency(
                      purchaseOrders.reduce((sum, po) => sum + (po.balance || 0), 0)
                    )}</p>
                  </div>
                </>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-medium">{accountType}</p>
              </div>
            </CardContent>
          </Card>
          
          {account.photo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Image</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <img 
                  src={account.photo} 
                  alt={`${account.account_name} profile`} 
                  className="rounded-md max-h-48 object-cover"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
