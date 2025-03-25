
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, AlertCircle, DollarSign, FileText, PackageOpen, Calendar, User } from 'lucide-react';
import { useAccount } from '@/hooks/useAccount';
import { formatCurrency } from '@/utils/format-utils';
import { EntityDetailLayout } from '@/components/common/EntityDetailLayout';
import { DetailCard } from '@/components/common/DetailCard';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { determineAccountType, getAccountTypeLabel } from '@/utils/accountMapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/types/accounts';
import { format } from 'date-fns';

const AccountDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, relatedData, isLoading, error } = useAccount(id || '');
  
  if (!account && !isLoading) {
    return (
      <EntityDetailLayout
        title={null}
        notFoundMessage="The requested account could not be found. It may have been deleted or you may not have permission to view it."
        backLink="/accounts"
      />
    );
  }

  const accountType = account ? determineAccountType(account.type) : 'unknown';
  const typeLabel = account?.type || '';
  
  const getStatusVariant = (): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    return accountType === 'customer' ? 'success' : 
           accountType === 'vendor' ? 'secondary' :
           accountType === 'both' ? 'default' : 'outline';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const hasInvoices = relatedData?.invoices && relatedData.invoices.length > 0;
  const hasPurchaseOrders = relatedData?.purchaseOrders && relatedData.purchaseOrders.length > 0;
  const hasProducts = relatedData?.products && relatedData.products.length > 0;

  const actionButtons = (
    <>
      <Button variant="outline" onClick={() => navigate(`/accounts/${id}/edit`)}>Edit Account</Button>
      {account?.is_customer && (
        <Button onClick={() => navigate(`/invoices/new?customerId=${id}`)}>New Invoice</Button>
      )}
      {account?.is_vendor && (
        <Button onClick={() => navigate(`/purchase-orders/new?vendorId=${id}`)}>New Purchase Order</Button>
      )}
    </>
  );

  return (
    <EntityDetailLayout
      title={account ? account.name : 'Loading...'}
      status={account ? { label: typeLabel, variant: getStatusVariant() } : undefined}
      actions={actionButtons}
      isLoading={isLoading}
      backLink="/accounts"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <DetailCard title="Contact Information" icon={User}>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={account?.photo} alt={account?.name} />
              <AvatarFallback>{account?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{account?.name}</h3>
              <Badge variant={getStatusVariant()} className="mt-1">
                {typeLabel}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {account?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${account.email}`} className="text-blue-600 hover:underline">
                  {account.email}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added: {formatDate(account?.created_at)}</span>
            </div>
          </div>
        </DetailCard>

        {/* Financial Information */}
        <DetailCard title="Financial Summary" icon={DollarSign}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Balance:</span>
              <AmountDisplay 
                amount={account?.balance || 0} 
                variant={account?.balance && account.balance > 0 ? 'destructive' : 'success'} 
              />
            </div>
            
            {(account?.is_customer) && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Invoiced:</span>
                <span>{hasInvoices 
                  ? formatCurrency(relatedData.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0))
                  : formatCurrency(0)}</span>
              </div>
            )}
            
            {(account?.is_vendor) && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Purchases:</span>
                <span>{hasPurchaseOrders
                  ? formatCurrency(relatedData.purchaseOrders.reduce((sum: number, po: any) => sum + (Number(po.total_amount) || 0), 0))
                  : formatCurrency(0)}</span>
              </div>
            )}
          </div>
        </DetailCard>

        {/* Activity Information */}
        <DetailCard title="Activity Summary" icon={FileText}>
          <div className="space-y-3">
            {(account?.is_customer) && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Invoices:</span>
                <Link to={`/invoices?customerId=${id}`} className="text-blue-600 hover:underline">
                  {hasInvoices ? `${relatedData.invoices.length} ${relatedData.invoices.length === 1 ? 'invoice' : 'invoices'}` : 'None'}
                </Link>
              </div>
            )}
            
            {(account?.is_vendor) && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Purchase Orders:</span>
                  <Link to={`/purchase-orders?vendorId=${id}`} className="text-blue-600 hover:underline">
                    {hasPurchaseOrders ? `${relatedData.purchaseOrders.length} ${relatedData.purchaseOrders.length === 1 ? 'order' : 'orders'}` : 'None'}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Products:</span>
                  <Link to={`/products?vendorId=${id}`} className="text-blue-600 hover:underline">
                    {hasProducts ? `${relatedData.products.length} ${relatedData.products.length === 1 ? 'product' : 'products'}` : 'None'}
                  </Link>
                </div>
              </>
            )}
          </div>
        </DetailCard>
      </div>

      {/* Tabs for different types of related data */}
      <Tabs defaultValue="transactions" className="mt-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {account?.is_customer && (
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          )}
          {account?.is_vendor && (
            <>
              <TabsTrigger value="purchases">Purchase Orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="transactions" className="mt-4">
          <DetailCard title="Recent Transactions">
            <div className="text-center py-8 text-muted-foreground">
              <p>Transaction history will be displayed here.</p>
              <p className="text-sm mt-2">No transactions found for this account.</p>
            </div>
          </DetailCard>
        </TabsContent>
        
        <TabsContent value="invoices" className="mt-4">
          <DetailCard title="Invoices">
            {hasInvoices ? (
              <div className="divide-y">
                {relatedData.invoices.map((invoice: any) => (
                  <div key={invoice.id} className="py-3 flex justify-between items-center">
                    <div>
                      <Link to={`/invoices/${invoice.id}`} className="font-medium text-blue-600 hover:underline">
                        Invoice #{invoice.glide_row_id?.substring(0, 8) || invoice.id.substring(0, 8)}
                      </Link>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                      <Badge variant={invoice.payment_status === 'paid' ? 'success' : invoice.payment_status === 'partial' ? 'warning' : 'destructive'}>
                        {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No invoices found for this customer.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(`/invoices/new?customerId=${id}`)}>
                  Create New Invoice
                </Button>
              </div>
            )}
          </DetailCard>
        </TabsContent>
        
        <TabsContent value="purchases" className="mt-4">
          <DetailCard title="Purchase Orders">
            {hasPurchaseOrders ? (
              <div className="divide-y">
                {relatedData.purchaseOrders.map((po: any) => (
                  <div key={po.id} className="py-3 flex justify-between items-center">
                    <div>
                      <Link to={`/purchase-orders/${po.id}`} className="font-medium text-blue-600 hover:underline">
                        PO #{po.purchase_order_uid || po.id.substring(0, 8)}
                      </Link>
                      <p className="text-sm text-muted-foreground">{formatDate(po.po_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(po.total_amount)}</p>
                      <Badge variant={po.payment_status === 'complete' ? 'success' : po.payment_status === 'partial' ? 'warning' : 'destructive'}>
                        {po.payment_status.charAt(0).toUpperCase() + po.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No purchase orders found for this vendor.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(`/purchase-orders/new?vendorId=${id}`)}>
                  Create New Purchase Order
                </Button>
              </div>
            )}
          </DetailCard>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <DetailCard title="Products">
            {hasProducts ? (
              <div className="divide-y">
                {relatedData.products.map((product: any) => (
                  <div key={product.id} className="py-3 flex justify-between items-center">
                    <div>
                      <Link to={`/products/${product.id}`} className="font-medium text-blue-600 hover:underline">
                        {product.display_name || product.vendor_product_name || 'Unnamed Product'}
                      </Link>
                      <p className="text-sm text-muted-foreground">Qty: {product.total_qty_purchased || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.cost)}</p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency((product.cost || 0) * (product.total_qty_purchased || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No products found from this vendor.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(`/products?vendorId=${id}`)}>
                  View All Products
                </Button>
              </div>
            )}
          </DetailCard>
        </TabsContent>
      </Tabs>
    </EntityDetailLayout>
  );
};

export default AccountDetailView;
