
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, 
  ChevronLeft, 
  CreditCard, 
  Edit, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  Trash 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import { Account, Invoice, PurchaseOrder, Estimate } from '@/types';
import { cn } from '@/lib/utils';

const AccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const getAccount = useStore((state) => state.getAccount);
  const deleteAccount = useStore((state) => state.deleteAccount);
  const invoices = useStore((state) => state.invoices);
  const purchaseOrders = useStore((state) => state.purchaseOrders);
  const estimates = useStore((state) => state.estimates);
  
  const account = getAccount(id || '');
  
  const [accountInvoices, setAccountInvoices] = useState<Invoice[]>([]);
  const [accountPurchaseOrders, setAccountPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [accountEstimates, setAccountEstimates] = useState<Estimate[]>([]);
  
  useEffect(() => {
    if (!account) {
      navigate('/accounts');
      return;
    }
    
    // Filter related documents
    setAccountInvoices(invoices.filter((invoice) => invoice.accountId === account.id));
    setAccountPurchaseOrders(purchaseOrders.filter((po) => po.accountId === account.id));
    setAccountEstimates(estimates.filter((estimate) => estimate.accountId === account.id));
  }, [account, invoices, purchaseOrders, estimates, navigate]);
  
  const handleDelete = () => {
    if (id) {
      deleteAccount(id);
      toast({
        title: 'Account Deleted',
        description: `${account?.name} has been deleted.`,
      });
      navigate('/accounts');
    }
  };
  
  if (!account) {
    return null;
  }
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  const getTypeLabel = (type: Account['type']) => {
    return {
      customer: 'Customer',
      vendor: 'Vendor',
      both: 'Customer & Vendor',
    }[type];
  };
  
  const getTypeColor = (type: Account['type']) => {
    return {
      customer: 'bg-blue-100 text-blue-800',
      vendor: 'bg-purple-100 text-purple-800',
      both: 'bg-gray-100 text-gray-800',
    }[type];
  };
  
  const getStatusColor = (status: Account['status']) => {
    return {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
    }[status];
  };
  
  return (
    <div className="animate-enter-bottom">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/accounts')}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{account.name}</h1>
          <div className="flex gap-2 ml-4">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getTypeColor(account.type))}>
              {getTypeLabel(account.type)}
            </span>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(account.status))}>
              {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/accounts/${id}/edit`)}
            className="hover-lift"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="hover-lift"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 hover-lift">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {account.email && (
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href={`mailto:${account.email}`} 
                    className="text-blue-600 hover:underline"
                  >
                    {account.email}
                  </a>
                </div>
              </div>
            )}
            
            {account.phone && (
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href={`tel:${account.phone}`} 
                    className="text-blue-600 hover:underline"
                  >
                    {account.phone}
                  </a>
                </div>
              </div>
            )}
            
            {account.address && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm">{account.address}</p>
                </div>
              </div>
            )}
            
            {account.website && (
              <div className="flex items-start">
                <Globe className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a 
                    href={account.website.startsWith('http') ? account.website : `https://${account.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {account.website}
                  </a>
                </div>
              </div>
            )}
            
            <div className="flex items-start">
              <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Balance</p>
                <p className={cn(
                  'text-sm font-semibold',
                  account.balance > 0 ? 'text-green-600' : 
                  account.balance < 0 ? 'text-red-600' : 
                  'text-foreground'
                )}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Building className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Type</p>
                <p className="text-sm font-semibold">
                  {getTypeLabel(account.type)}
                </p>
              </div>
            </div>
          </CardContent>
          
          {account.notes && (
            <>
              <Separator />
              <CardContent className="mt-4">
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{account.notes}</p>
              </CardContent>
            </>
          )}
          
          <CardFooter className="flex flex-col items-start gap-2">
            <div className="text-xs text-muted-foreground">
              Created: {new Date(account.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Last Updated: {new Date(account.updatedAt).toLocaleDateString()}
            </div>
          </CardFooter>
        </Card>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="invoices">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="estimates">Estimates</TabsTrigger>
              <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="invoices" className="mt-4">
              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                      {accountInvoices.length} invoice{accountInvoices.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/invoices/new', { state: { accountId: account.id } })}
                    className="hover-lift"
                  >
                    New Invoice
                  </Button>
                </CardHeader>
                <CardContent>
                  {accountInvoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No invoices found</p>
                  ) : (
                    <div className="space-y-4">
                      {accountInvoices
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((invoice) => (
                          <div 
                            key={invoice.id} 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 cursor-pointer"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            <div>
                              <p className="font-medium">{invoice.number}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(invoice.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-medium">{formatCurrency(invoice.total)}</p>
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              )}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="estimates" className="mt-4">
              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Estimates</CardTitle>
                    <CardDescription>
                      {accountEstimates.length} estimate{accountEstimates.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/estimates/new', { state: { accountId: account.id } })}
                    className="hover-lift"
                  >
                    New Estimate
                  </Button>
                </CardHeader>
                <CardContent>
                  {accountEstimates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No estimates found</p>
                  ) : (
                    <div className="space-y-4">
                      {accountEstimates
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((estimate) => (
                          <div 
                            key={estimate.id} 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 cursor-pointer"
                            onClick={() => navigate(`/estimates/${estimate.id}`)}
                          >
                            <div>
                              <p className="font-medium">{estimate.number}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(estimate.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-medium">{formatCurrency(estimate.total)}</p>
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                estimate.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                estimate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              )}>
                                {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="purchase-orders" className="mt-4">
              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>
                      {accountPurchaseOrders.length} purchase order{accountPurchaseOrders.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/purchase-orders/new', { state: { accountId: account.id } })}
                    className="hover-lift"
                  >
                    New Purchase Order
                  </Button>
                </CardHeader>
                <CardContent>
                  {accountPurchaseOrders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No purchase orders found</p>
                  ) : (
                    <div className="space-y-4">
                      {accountPurchaseOrders
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((po) => (
                          <div 
                            key={po.id} 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 cursor-pointer"
                            onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          >
                            <div>
                              <p className="font-medium">{po.number}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(po.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-medium">{formatCurrency(po.total)}</p>
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                po.status === 'received' ? 'bg-green-100 text-green-800' :
                                po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              )}>
                                {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {account.name}? This action cannot be undone.
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

export default AccountDetail;
