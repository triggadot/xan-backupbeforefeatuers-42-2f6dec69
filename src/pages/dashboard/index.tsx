import BusinessMetricsCard from '@/components/dashboard/modern/business-metrics';
import NewTransactionDialog from '@/components/dashboard/modern/NewTransactionDialog';
import QuickTransferCard from '@/components/dashboard/modern/QuickTransferCard';
import RecentTransactionsTable from '@/components/dashboard/modern/RecentTransactionsTable';
import TransactionChart from '@/components/dashboard/modern/TransactionChart';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GridItem, ResponsiveGrid } from '@/components/ui/responsive-grid';
import { useBreakpoint } from '@/hooks/utils/use-mobile';
import { ShowAt } from '@/hooks/utils/use-responsive';
import { formatCurrency } from '@/lib/dashboard/analytics';
import { useBusinessMetrics, useChartData, useContacts, useFinancialMetrics, useRecentTransactions } from '@/lib/dashboard/hooks';
import {
  CreditCard,
  DollarSign,
  Loader2,
  TrendingUp,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function ModernDashboard() {
  const isMobile = useBreakpoint('md');
  const [timeFilter, setTimeFilter] = useState('30d');
  const queryClient = useQueryClient();

  // Fetch real data using hooks - these now use our Supabase SQL functions
  const {
    data: businessMetrics,
    isLoading: isLoadingMetrics
  } = useBusinessMetrics();

  const {
    data: chartData,
    isLoading: isLoadingChart
  } = useChartData(12); // Show a full year of data

  const {
    data: transactions,
    isLoading: isLoadingTransactions
  } = useRecentTransactions(10, timeFilter);

  const {
    data: financialMetrics,
    isLoading: isLoadingFinancials
  } = useFinancialMetrics();

  const {
    data: contacts,
    isLoading: isLoadingContacts
  } = useContacts(5);

  // Calculated metrics
  const totalRevenue = financialMetrics?.find(m => m.label === 'Revenue')?.value || 0;
  const paidInvoices = financialMetrics?.find(m => m.label === 'Revenue')?.secondaryValue || 0;
  const collectionRate = totalRevenue > 0 ? Math.round((paidInvoices / totalRevenue) * 100) : 0;

  const handleQuickTransfer = async (contactId: string, amount: number) => {
    console.log(`Transfer $${amount} to contact ${contactId}`);
    // In a real implementation, this would call the Supabase functions API to process the transfer
    return new Promise<void>(resolve => setTimeout(resolve, 1000));
  };

  return (
    <Container>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your business operations and financial metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NewTransactionDialog onTransactionAdded={() => {
            // Refetch data after transaction added
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
            queryClient.invalidateQueries({ queryKey: ['businessMetrics'] });
          }} />
        </div>
      </div>

      {/* Top Metrics */}
      <ResponsiveGrid
        columns={{ xs: 1, sm: 2, lg: 3, xl: 4 }}
        gap={4}
        className="mb-6"
      >
        <GridItem>
          <BusinessMetricsCard
            title="Total Balance"
            value={isLoadingMetrics ? 0 : businessMetrics?.totalBalance || 0}
            formatter={formatCurrency}
            change={businessMetrics?.growthRate || 0}
            icon={<DollarSign className="h-4 w-4" />}
            className={isLoadingMetrics ? "opacity-70" : ""}
          />
          {isLoadingMetrics && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </GridItem>
        <GridItem>
          <BusinessMetricsCard
            title="Active Customer Accounts"
            value={isLoadingMetrics ? 0 : businessMetrics?.activeCustomers || 0}
            change={collectionRate}
            secondaryText={`${collectionRate}% collection rate`}
            icon={<Users className="h-4 w-4" />}
            className={isLoadingMetrics ? "opacity-70" : ""}
          />
          {isLoadingMetrics && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </GridItem>
        <GridItem>
          <BusinessMetricsCard
            title="Monthly Revenue"
            value={isLoadingMetrics ? 0 : businessMetrics?.monthlyRevenue || 0}
            formatter={formatCurrency}
            change={businessMetrics?.growthRate || 0}
            icon={<CreditCard className="h-4 w-4" />}
            className={isLoadingMetrics ? "opacity-70" : ""}
          />
          {isLoadingMetrics && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </GridItem>
        <GridItem>
          <BusinessMetricsCard
            title="Total Products"
            value={isLoadingMetrics ? 0 : businessMetrics?.totalProducts || 0}
            change={businessMetrics?.growthRate || 0}
            icon={<TrendingUp className="h-4 w-4" />}
            className={isLoadingMetrics ? "opacity-70" : ""}
          />
          {isLoadingMetrics && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </GridItem>
      </ResponsiveGrid>

      {/* Charts and Financial Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 relative">
          <TransactionChart
            data={chartData || []}
            className="h-full"
          />
          {isLoadingChart && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Transfer */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="relative">
          <QuickTransferCard
            contacts={contacts || []}
            onTransfer={handleQuickTransfer}
            className="h-full"
          />
          {isLoadingContacts && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <RecentTransactionsTable
            transactions={transactions || []}
            onViewAll={() => console.log('View all transactions')}
            onTimeChange={setTimeFilter}
            selectedTime={timeFilter}
            isLoading={isLoadingTransactions}
          />
        </div>
        <div className="relative">
          
            metrics={financialMetrics || []}
            onTimeChange={setTimeFilter}
            selectedTime={timeFilter}
            isLoading={isLoadingFinancials}
          />
        </div>
      </div>

      {/* Mobile quick actions */}
      <ShowAt breakpoint="sm" below>
        <div className="fixed bottom-20 right-4 z-40">
          <Button className="h-14 w-14 rounded-full shadow-lg" size="icon">
            <TrendingUp className="h-6 w-6" />
          </Button>
        </div>
      </ShowAt>
    </Container>
  );
}
