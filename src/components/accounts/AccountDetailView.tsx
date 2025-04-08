import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, AlertCircle, DollarSign, FileText, PackageOpen, Calendar, User } from 'lucide-react';
import { useAccountDetail } from '@/hooks/accounts/useAccountDetail';
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

interface AccountDetailViewProps {
  isEditing?: boolean;
}

const AccountDetailView: React.FC<AccountDetailViewProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, relatedData, isLoading, isError } = useAccountDetail(id);
  const [editMode, setEditMode] = useState<boolean>(isEditing);
  
  // Set edit mode based on prop changes
  useEffect(() => {
    setEditMode(isEditing);
  }, [isEditing]);
  
  if (!account && !isLoading) {
    return (
      <EntityDetailLayout
        title={null}
        notFoundMessage="The requested account could not be found. It may have been deleted or you may not have permission to view it."
        backLink="/accounts"
      >
        {null}
      </EntityDetailLayout>
    );
  }

  const accountType = account ? 
    (account.is_customer && account.is_vendor ? 'both' : 
      account.is_customer ? 'customer' : 
      account.is_vendor ? 'vendor' : 'unknown') 
    : 'unknown';
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
  const hasEstimates = relatedData?.estimates && relatedData.estimates.length > 0;

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // If in edit mode, navigate back to view mode
      navigate(`/accounts/${id}`);
    } else {
      // If in view mode, navigate to edit mode
      navigate(`/accounts/${id}/edit`);
    }
    setEditMode(!editMode);
  };

  const actionButtons = (
    <>
      <Button 
        variant={editMode ? "default" : "outline"} 
        onClick={handleEditToggle}
      >
        {editMode ? "Cancel Edit" : "Edit Account"}
      </Button>
      {account?.is_customer && !editMode && (
        <Button onClick={() => navigate(`/invoices/new?customerId=${id}`)}>New Invoice</Button>
      )}
      {account?.is_vendor && !editMode && (
        <Button onClick={() => navigate(`/purchase-orders/new?vendorId=${id}`)}>New Purchase Order</Button>
      )}
      {editMode && (
        <Button type="submit" form="account-edit-form">Save Changes</Button>
      )}
    </>
  );

  // Render different content based on edit mode
  const renderContent = () => {
    if (editMode) {
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Edit Account</h2>
            <div className="text-sm text-gray-500 mb-4">
              Edit mode is currently being implemented. This feature will be available soon.
            </div>
            <form id="account-edit-form" onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission in a future implementation
              navigate(`/accounts/${id}`);
              setEditMode(false);
            }}>
              {/* Form fields will be added in future implementation */}
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <DetailCard title="Contact Information" icon={User}>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={account?.photo || ''} alt={account?.name} />
              <AvatarFallback>{account?.name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{account?.name}</h3>
              <p className="text-sm text-muted-foreground">{account?.accounts_uid || 'No ID'}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {account?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{account.email}</span>
              </div>
            )}
            
            {account?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{account.phone}</span>
              </div>
            )}
            
            {account?.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Added on {formatDate(account.created_at)}</span>
              </div>
            )}
          </div>
        </DetailCard>

        {/* Financial Information */}
        <DetailCard title="Financial Information" icon={DollarSign}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <AmountDisplay amount={account?.balance || 0} />
            </div>
            
            {hasInvoices && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recent Activity</p>
                <div className="text-sm">
                  <p>{relatedData?.invoices.length || 0} invoices</p>
                  <p>{relatedData?.invoices.filter(inv => inv.status === 'paid').length || 0} paid</p>
                  <p>{relatedData?.invoices.filter(inv => inv.status === 'pending').length || 0} pending</p>
                  {hasEstimates && (
                    <p>{relatedData?.estimates.length || 0} estimates</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DetailCard>

        {/* Account Status */}
        <DetailCard title="Account Status" icon={AlertCircle}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Account Type</p>
              <div className="flex gap-2">
                {accountType === 'customer' && <Badge variant="success">Customer</Badge>}
                {accountType === 'vendor' && <Badge variant="secondary">Vendor</Badge>}
                {accountType === 'both' && (
                  <>
                    <Badge variant="success">Customer</Badge>
                    <Badge variant="secondary">Vendor</Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* For now, we'll just use created_at since we don't have specific "Added Date" */}
            {account?.created_at && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer Since</p>
                <p>{formatDate(account.created_at)}</p>
              </div>
            )}
            
            {/* Display user who added the account if we have that data in the future */}
            {account?.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-xs">{account.notes}</p>
              </div>
            )}
          </div>
        </DetailCard>

        {/* Tabs for Different Data Types */}
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue="invoices">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="invoices" disabled={!hasInvoices}>
                Invoices {hasInvoices && `(${relatedData?.invoices?.length})`}
              </TabsTrigger>
              <TabsTrigger value="purchase-orders" disabled={!hasPurchaseOrders}>
                Purchase Orders {hasPurchaseOrders && `(${relatedData?.purchaseOrders?.length})`}
              </TabsTrigger>
              <TabsTrigger value="products" disabled={!hasProducts}>
                Products {hasProducts && `(${relatedData?.products?.length})`}
              </TabsTrigger>
              <TabsTrigger value="estimates" disabled={!hasEstimates}>
                Estimates {hasEstimates && `(${relatedData?.estimates?.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="invoices" className="mt-4">
              {hasInvoices ? (
                <div className="bg-white rounded-lg overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatedData?.invoices?.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900">
                                {invoice.invoice_uid || invoice.number || invoice.id.substring(0, 8)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(invoice.invoice_order_date || invoice.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(invoice.total_amount || invoice.amount || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(invoice.balance || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                                {invoice.supabase_pdf_url && (
                                  <a href={invoice.supabase_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">PDF</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border text-center">
                  <p className="text-muted-foreground">No invoices found for this account.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="purchase-orders" className="mt-4">
              {hasPurchaseOrders ? (
                <div className="bg-white rounded-lg overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatedData?.purchaseOrders?.map((po) => (
                          <tr key={po.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:text-blue-900">
                                {po.purchase_order_uid || po.number || po.id.substring(0, 8)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(po.po_date || po.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(po.total_amount || po.amount || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(po.balance || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                                {po.supabase_pdf_url && (
                                  <a href={po.supabase_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">PDF</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border text-center">
                  <p className="text-muted-foreground">No purchase orders found for this account.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="products" className="mt-4">
              {hasProducts ? (
                <div className="bg-white rounded-lg overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatedData?.products?.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link to={`/products/${product.id}`} className="text-blue-600 hover:text-blue-900">
                                {product.vendor_product_name || product.main_new_product_name || product.new_product_name || product.name || 'Unnamed Product'}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{product.sku || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(product.cost || product.price || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {product.samples ? 'Sample' : product.fronted ? 'Fronted' : 'Regular'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Link to={`/products/${product.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                                {product.supabase_pdf_url && (
                                  <a href={product.supabase_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">PDF</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border text-center">
                  <p className="text-muted-foreground">No products found for this account.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="estimates" className="mt-4">
              {hasEstimates ? (
                <div className="bg-white rounded-lg overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimate #</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatedData?.estimates?.map((estimate) => (
                          <tr key={estimate.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link to={`/estimates/${estimate.id}`} className="text-blue-600 hover:text-blue-900">
                                {estimate.estimate_uid || estimate.number || estimate.estimate_number || estimate.id.substring(0, 8)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(estimate.estimate_date || estimate.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(estimate.total_amount || estimate.amount || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {estimate.status === 'converted' ? 'Yes' : 'No'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Link to={`/estimates/${estimate.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                                {estimate.supabase_pdf_url && (
                                  <a href={estimate.supabase_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">PDF</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border text-center">
                  <p className="text-muted-foreground">No estimates found for this account.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <EntityDetailLayout
      title={account ? account.name : 'Loading...'}
      status={account ? { label: typeLabel, variant: getStatusVariant() } : undefined}
      actions={actionButtons}
      isLoading={isLoading}
      backLink="/accounts"
    >
      {renderContent()}
    </EntityDetailLayout>
  );
};

export default AccountDetailView;
