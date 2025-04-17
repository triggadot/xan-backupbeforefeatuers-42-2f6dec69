
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, ReceiptText, ShoppingCart, FileText, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/utils/use-toast';
import AccountForm from '@/components/accounts/AccountForm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAccountDetail } from '@/hooks/accounts/useAccountDetail';
import { useEstimates } from '@/hooks/estimates/useEstimates';

interface AccountDetailViewProps {
  isEditing?: boolean;
}

const AccountDetailView: React.FC<AccountDetailViewProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(isEditing);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [expandedEstimate, setExpandedEstimate] = useState<string | null>(null);

  // Fetch account data and related information
  const { account, relatedData, isLoading, isError, error, getAccount } = useAccountDetail(id);
  
  // Get estimates for this account
  const { data: estimates, isLoading: isEstimatesLoading } = useEstimates({ 
    accountId: account?.glide_row_id || '',
  });

  const handleUpdateAccount = async (data: any) => {
    try {
      // Implementation would go here
      toast({
        title: "Account updated",
        description: "Account details have been updated successfully",
      });
      setIsEditDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Implementation would go here
      toast({
        title: "Account deleted",
        description: "Account has been deleted successfully",
      });
      navigate('/accounts');
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  // Loading state
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

  // Error state
  if (isError || !account) {
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
          <p>{error instanceof Error ? error.message : 'Account not found'}</p>
        </div>
      </div>
    );
  }

  const invoices = relatedData?.invoices || [];
  const purchaseOrders = relatedData?.purchaseOrders || [];

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'unpaid':
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'converted': 
        return <Badge className="bg-purple-100 text-purple-800">Converted</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="container py-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link to="/accounts">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{account.name || account.account_name}</h1>
            <Badge 
              className={`ml-4 capitalize ${account.is_customer ? 'bg-blue-100 text-blue-800' : ''} ${account.is_vendor ? 'bg-amber-100 text-amber-800' : ''}`}
            >
              {account.is_customer && account.is_vendor ? 'Customer & Vendor' : account.is_customer ? 'Customer' : 'Vendor'}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Type</div>
            <div className="text-2xl font-semibold capitalize">
              {account.is_customer && account.is_vendor 
                ? 'Customer & Vendor' 
                : account.is_customer 
                  ? 'Customer' 
                  : 'Vendor'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Balance</div>
            <div className="text-2xl font-semibold">{formatCurrency(account.balance || 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Invoices</div>
            <div className="text-2xl font-semibold">
              {relatedData?.stats?.totalInvoices || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Purchase Orders</div>
            <div className="text-2xl font-semibold">
              {relatedData?.stats?.totalPurchaseOrders || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Details Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Account Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-md">{account.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-md">{account.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="text-md">{account.website || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <p className="text-md">{account.accounts_uid || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-md">{formatDate(account.created_at) || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Financial Summary Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Total Invoiced</p>
                    <p className="text-md font-medium">{formatCurrency(relatedData?.stats?.totalInvoiceAmount || 0)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-md font-medium">{formatCurrency(relatedData?.stats?.totalPaid || 0)}</p>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <p className="text-sm font-medium">Outstanding Balance</p>
                    <p className={`text-md font-medium ${(relatedData?.stats?.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(relatedData?.stats?.balance || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recent Invoices</h3>
                <Link to={`/invoices?accountId=${account.id}`}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {invoices.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">No invoices found</p>
                  <Link to="/invoices/new">
                    <Button size="sm" className="mt-2">
                      <ReceiptText className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.slice(0, 3).map((invoice) => (
                    <Card key={invoice.id} className="overflow-hidden">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <div>
                          <div className="font-medium">Invoice #{invoice.invoice_uid || invoice.id?.substring(0, 8)}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(invoice.date_of_invoice || invoice.created_at)}</div>
                          <div className="mt-1">{getStatusBadge(invoice.payment_status || 'unknown')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(invoice.total_amount || 0)}</div>
                          <div className={`text-sm ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {invoice.balance > 0 ? `Due: ${formatCurrency(invoice.balance)}` : 'Paid in full'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recent Purchase Orders</h3>
                <Link to={`/purchase-orders?accountId=${account.id}`}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {purchaseOrders.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">No purchase orders found</p>
                  <Link to="/purchase-orders/new">
                    <Button size="sm" className="mt-2">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchaseOrders.slice(0, 3).map((po) => (
                    <Card key={po.id} className="overflow-hidden">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      >
                        <div>
                          <div className="font-medium">PO #{po.purchase_order_uid || po.id?.substring(0, 8)}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(po.po_date || po.created_at)}</div>
                          <div className="mt-1">{getStatusBadge(po.payment_status || 'unknown')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(po.total_amount || 0)}</div>
                          <div className={`text-sm ${po.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {po.balance > 0 ? `Due: ${formatCurrency(po.balance)}` : 'Paid in full'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Invoices</h3>
            <Link to={`/invoices/new?accountId=${account.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
          
          {invoices.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <p className="text-muted-foreground">No invoices found for this account</p>
              <Link to={`/invoices/new?accountId=${account.id}`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <Card>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <React.Fragment key={invoice.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                        >
                          <TableCell className="font-medium">
                            {invoice.invoice_uid || invoice.id?.substring(0, 8)}
                          </TableCell>
                          <TableCell>{formatDate(invoice.date_of_invoice || invoice.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.payment_status || 'unknown')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.total_amount || 0)}</TableCell>
                          <TableCell className={`text-right ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(invoice.balance || 0)}
                          </TableCell>
                          <TableCell>
                            {expandedInvoice === invoice.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable content - Invoice Line Items */}
                        {expandedInvoice === invoice.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-muted/50 p-4">
                                <h4 className="font-medium mb-2">Line Items</h4>
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {invoice.lines && invoice.lines.length > 0 ? (
                                        invoice.lines.map((line, index) => (
                                          <TableRow key={line.id || index}>
                                            <TableCell>{line.renamed_product_name || line.product_name_display || 'Unnamed Product'}</TableCell>
                                            <TableCell>{line.qty_sold || 0}</TableCell>
                                            <TableCell>{formatCurrency(line.selling_price || 0)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(line.line_total || 0)}</TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No line items found
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                                <div className="flex justify-end mt-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/invoices/${invoice.id}`);
                                    }}
                                  >
                                    View Full Invoice
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
        
        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Purchase Orders</h3>
            <Link to={`/purchase-orders/new?accountId=${account.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Button>
            </Link>
          </div>
          
          {purchaseOrders.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <p className="text-muted-foreground">No purchase orders found for this account</p>
              <Link to={`/purchase-orders/new?accountId=${account.id}`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Purchase Order
                </Button>
              </Link>
            </div>
          ) : (
            <Card>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">PO #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <React.Fragment key={po.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                        >
                          <TableCell className="font-medium">
                            {po.purchase_order_uid || po.id?.substring(0, 8)}
                          </TableCell>
                          <TableCell>{formatDate(po.po_date || po.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(po.payment_status || 'unknown')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(po.total_amount || 0)}</TableCell>
                          <TableCell className={`text-right ${po.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(po.balance || 0)}
                          </TableCell>
                          <TableCell>
                            {expandedPO === po.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable content for purchase order */}
                        {expandedPO === po.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-muted/50 p-4">
                                <h4 className="font-medium mb-2">Products</h4>
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {po.products && po.products.length > 0 ? (
                                        po.products.map((product, index) => (
                                          <TableRow key={product.id || index}>
                                            <TableCell>{product.display_name || product.vendor_product_name || 'Unnamed Product'}</TableCell>
                                            <TableCell>{product.total_qty_purchased || 0}</TableCell>
                                            <TableCell>{formatCurrency(product.cost || 0)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(product.total_cost || 0)}</TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No products found
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                                <div className="flex justify-end mt-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/purchase-orders/${po.id}`);
                                    }}
                                  >
                                    View Full Purchase Order
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
        
        {/* Estimates Tab */}
        <TabsContent value="estimates" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Estimates</h3>
            <Link to={`/estimates/new?accountId=${account.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Estimate
              </Button>
            </Link>
          </div>
          
          {isEstimatesLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse text-muted-foreground">Loading estimates...</div>
            </div>
          ) : !estimates || estimates.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <p className="text-muted-foreground">No estimates found for this account</p>
              <Link to={`/estimates/new?accountId=${account.id}`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Estimate
                </Button>
              </Link>
            </div>
          ) : (
            <Card>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Estimate #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((estimate) => (
                      <React.Fragment key={estimate.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedEstimate(expandedEstimate === estimate.id ? null : estimate.id)}
                        >
                          <TableCell className="font-medium">
                            {estimate.estimate_uid || `EST-${estimate.id?.substring(0, 8)}`}
                          </TableCell>
                          <TableCell>{formatDate(estimate.estimate_date || estimate.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(estimate.status || 'draft')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(estimate.total_amount || 0)}</TableCell>
                          <TableCell>
                            {expandedEstimate === estimate.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable content for estimates */}
                        {expandedEstimate === estimate.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-muted/50 p-4">
                                <h4 className="font-medium mb-2">Line Items</h4>
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {estimate.estimateLines && estimate.estimateLines.length > 0 ? (
                                        estimate.estimateLines.map((line, index) => (
                                          <TableRow key={line.id || index}>
                                            <TableCell>{line.sale_product_name || line.product_name_display || 'Unnamed Product'}</TableCell>
                                            <TableCell>{line.qty_sold || 0}</TableCell>
                                            <TableCell>{formatCurrency(line.selling_price || 0)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(line.line_total || 0)}</TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No line items found
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                                <div className="flex justify-end mt-4 gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/estimates/${estimate.id}`);
                                    }}
                                  >
                                    View Estimate
                                  </Button>
                                  {estimate.status !== 'converted' && (
                                    <Button 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/estimates/${estimate.id}`);
                                      }}
                                    >
                                      Convert to Invoice
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {account && <AccountForm defaultValues={account} onSubmit={handleUpdateAccount} />}
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
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDetailView;
