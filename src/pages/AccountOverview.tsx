import React from 'react';
import { useParams } from 'react-router-dom';
import { useAccountOverview } from '@/hooks/accounts/useAccountOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { UnpaidInvoicesTable } from '@/components/accounts/overview/UnpaidInvoicesTable';
import { PaymentsTable } from '@/components/accounts/overview/PaymentsTable';
import { CreditsTable } from '@/components/accounts/overview/CreditsTable';
import { SampleEstimatesTable } from '@/components/accounts/overview/SampleEstimatesTable';
import { FinancialSummary } from '@/components/accounts/overview/FinancialSummary';
import { format } from 'date-fns';
import { User, Calendar, CreditCard, FileText, DollarSign } from 'lucide-react';

/**
 * Account Overview Page
 * Displays comprehensive financial information for a specific account including:
 * - Account balance summary
 * - Unpaid invoices with line items
 * - Sample estimates
 * - Payment history
 * - Credits
 */
const AccountOverview: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { overview, isLoading, isError, error } = useAccountOverview(accountId || '');

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <p>{error instanceof Error ? error.message : 'Failed to load account overview'}</p>
        </div>
      </div>
    );
  }

  const { account, unpaidInvoices, sampleEstimates, payments, credits, totalBalance, totalUnpaid, totalPaid } = overview;

  if (!account) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <p>Account not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      {/* Account Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {account.photo ? (
              <AvatarImage src={account.photo} alt={account.name} />
            ) : null}
            <AvatarFallback className="text-lg">{getInitials(account.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{account.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={16} />
              <span>{account.is_customer && account.is_vendor ? 'Customer & Vendor' : account.is_customer ? 'Customer' : 'Vendor'}</span>
              {account.email && (
                <>
                  <span className="mx-1">•</span>
                  <span>{account.email}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-8">
        <FinancialSummary 
          invoices={unpaidInvoices}
          payments={payments}
          credits={credits}
          totalBalance={totalBalance}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="open-invoices" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="open-invoices">Open Invoices</TabsTrigger>
          <TabsTrigger value="sample-estimates">Sample Estimates</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open-invoices" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Open Invoices</CardTitle>
              <CardDescription>
                All invoices with a non-zero balance (including unpaid and overpaid).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnpaidInvoicesTable invoices={unpaidInvoices} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sample-estimates" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Sample Estimates</CardTitle>
              <CardDescription>
                Estimates marked as samples for this account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SampleEstimatesTable estimates={sampleEstimates} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All payments received from this account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTable payments={payments} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="credits" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
              <CardDescription>
                All credits associated with this account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditsTable credits={credits} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountOverview;
