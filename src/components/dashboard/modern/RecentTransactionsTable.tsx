import { SplitButtonDropdown } from '@/components/custom/SplitButtonDropdown';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useBreakpoint } from '@/hooks/utils/use-mobile';
import { cn } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Loader2, RefreshCcw } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  entity_type: string;
  entity_id: string;
  account_name?: string;
}

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  className?: string;
  onViewAll?: () => void;
  timeOptions?: Array<{ label: string; value: string; }>;
  onTimeChange?: (value: string) => void;
  selectedTime?: string;
  isLoading?: boolean;
}

export default function RecentTransactionsTable({
  transactions,
  className,
  onViewAll,
  timeOptions = [
    { label: '7 Days', value: '7d' },
    { label: '14 Days', value: '14d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
  ],
  onTimeChange,
  selectedTime = '30d',
  isLoading = false,
}: RecentTransactionsTableProps) {
  const isMobile = useBreakpoint('md');
  
  // Map transaction type to icon
  const getTypeIcon = (type: Transaction['transaction_type']) => {
    switch (type) {
      case 'payment':
        return <ArrowDownCircle className="h-4 w-4 text-emerald-500" />;
      case 'invoice':
        return <ArrowDownCircle className="h-4 w-4 text-blue-500" />;
      case 'purchase_order':
        return <ArrowUpCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <RefreshCcw className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format date string with time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Format amount
  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
    
    return amount >= 0 ? formatted : `-${formatted}`;
  };
  
  // Get type badge based on transaction and entity type
  const getTypeBadge = (transaction: Transaction) => {
    switch (transaction.entity_type) {
      case 'invoice':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Invoice</Badge>;
      case 'purchase_order':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">Purchase</Badge>;
      case 'customer_payment':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Payment In</Badge>;
      case 'vendor_payment':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Payment Out</Badge>;
      default:
        return <Badge variant="outline">{transaction.entity_type}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2">
          {timeOptions && onTimeChange && (
            <SplitButtonDropdown
              options={timeOptions}
              initialSelectedValue={selectedTime}
              onSelectionChange={(value) => onTimeChange(value)}
              size="sm"
              compactOnMobile={true}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                {!isMobile && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Account</th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Type</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading state skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b last:border-0">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        {isMobile && <Skeleton className="h-4 w-4 rounded-full" />}
                        <div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32 mt-1" />
                        </div>
                      </div>
                    </td>
                    {!isMobile && (
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 align-middle">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                // Actual transactions
                transactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        {isMobile && getTypeIcon(transaction.transaction_type)}
                        <div>
                          <div className="font-medium text-sm">{formatDate(transaction.transaction_date)}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {transaction.description}
                          </div>
                          {transaction.account_name && (
                            <div className="text-xs text-muted-foreground italic mt-1 truncate max-w-[180px]">
                              {transaction.account_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {!isMobile && (
                      <td className="px-4 py-3 align-middle text-sm">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.transaction_type)}
                          <span className="capitalize">{transaction.account_name || 'Unknown'}</span>
                        </div>
                      </td>
                    )}
                    <td className={cn(
                      "px-4 py-3 align-middle text-sm font-medium",
                      transaction.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : 
                      "text-rose-600 dark:text-rose-400"
                    )}>
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      {getTypeBadge(transaction)}
                    </td>
                  </tr>
                ))
              ) : (
                // No transactions state
                <tr>
                  <td colSpan={isMobile ? 3 : 4} className="px-4 py-4 text-center text-muted-foreground text-sm">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {onViewAll && (
          <div className="flex justify-center p-3 border-t">
            <button 
              className="text-sm text-primary hover:underline flex items-center gap-1"
              onClick={onViewAll}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading...
                </>
              ) : (
                'See All'
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 