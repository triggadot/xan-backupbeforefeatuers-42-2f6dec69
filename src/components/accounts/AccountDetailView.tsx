
import React, { useEffect, useState } from 'react';
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
import { GlAccount } from '@/types/account';

const AccountDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, isLoading, error } = useAccount(id || '');
  
  if (!account && !isLoading) {
    return (
      <EntityDetailLayout
        title={null}
        notFoundMessage="The requested account could not be found. It may have been deleted or you may not have permission to view it."
        backLink="/accounts"
      />
    );
  }

  const accountType = account ? determineAccountType(account.client_type) : 'unknown';
  const typeLabel = getAccountTypeLabel(accountType);
  
  const getStatusVariant = (): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    return accountType === 'customer' ? 'success' : 
           accountType === 'vendor' ? 'secondary' :
           accountType === 'both' ? 'default' : 'outline';
  };

  const actionButtons = (
    <>
      <Button variant="outline" onClick={() => navigate(`/accounts/${id}/edit`)}>Edit Account</Button>
      <Button>New Invoice</Button>
    </>
  );

  return (
    <EntityDetailLayout
      title={account ? account.account_name : 'Loading...'}
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
              <AvatarImage src={account?.photo} alt={account?.account_name} />
              <AvatarFallback>{account?.account_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{account?.account_name}</h3>
              <Badge variant={getStatusVariant()} className="mt-1">
                {typeLabel}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {account?.email_of_who_added && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${account.email_of_who_added}`} className="text-blue-600 hover:underline">
                  {account.email_of_who_added}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added: {account?.date_added_client ? new Date(account.date_added_client).toLocaleDateString() : 'N/A'}</span>
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
            
            {accountType === 'customer' || accountType === 'both' ? (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Invoiced:</span>
                <span>Loading...</span>
              </div>
            ) : null}
            
            {accountType === 'vendor' || accountType === 'both' ? (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Purchases:</span>
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </DetailCard>

        {/* Activity Information */}
        <DetailCard title="Activity Summary" icon={FileText}>
          <div className="space-y-3">
            {accountType === 'customer' || accountType === 'both' ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invoices:</span>
                  <Link to={`/invoices?customerId=${id}`} className="text-blue-600 hover:underline">View All</Link>
                </div>
              </>
            ) : null}
            
            {accountType === 'vendor' || accountType === 'both' ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Purchase Orders:</span>
                  <Link to={`/purchase-orders?vendorId=${id}`} className="text-blue-600 hover:underline">View All</Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Products:</span>
                  <Link to={`/products?vendorId=${id}`} className="text-blue-600 hover:underline">View All</Link>
                </div>
              </>
            ) : null}
          </div>
        </DetailCard>
      </div>

      {/* Tabs for different types of related data */}
      <Tabs defaultValue="transactions" className="mt-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {accountType === 'customer' || accountType === 'both' ? (
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          ) : null}
          {accountType === 'vendor' || accountType === 'both' ? (
            <>
              <TabsTrigger value="purchases">Purchase Orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </>
          ) : null}
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
            <div className="text-center py-8 text-muted-foreground">
              <p>Invoice history will be displayed here.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(`/invoices/new?customerId=${id}`)}>
                Create New Invoice
              </Button>
            </div>
          </DetailCard>
        </TabsContent>
        
        <TabsContent value="purchases" className="mt-4">
          <DetailCard title="Purchase Orders">
            <div className="text-center py-8 text-muted-foreground">
              <p>Purchase order history will be displayed here.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(`/purchase-orders/new?vendorId=${id}`)}>
                Create New Purchase Order
              </Button>
            </div>
          </DetailCard>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <DetailCard title="Products">
            <div className="text-center py-8 text-muted-foreground">
              <p>Products from this vendor will be displayed here.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(`/products?vendorId=${id}`)}>
                View All Products
              </Button>
            </div>
          </DetailCard>
        </TabsContent>
      </Tabs>
    </EntityDetailLayout>
  );
};

export default AccountDetailView;
