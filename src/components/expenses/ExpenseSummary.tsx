
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense } from '@/types/expenses';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface ExpenseSummaryProps {
  expenses: Expense[];
  isLoading: boolean;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ expenses, isLoading }) => {
  const summaryData = useMemo(() => {
    if (!expenses.length) return {
      totalAmount: 0,
      categoryBreakdown: {},
      thisMonth: 0,
      lastMonth: 0,
      monthlyChange: 0,
      monthlyChangePercent: 0
    };

    // Calculate summary metrics
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Group by category
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach(exp => {
      const category = exp.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (exp.amount || 0);
    });

    // Calculate this month and last month totals
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthTotal = expenses
      .filter(exp => {
        const expDate = exp.date ? new Date(exp.date) : null;
        return expDate && expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear;
      })
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const lastMonthTotal = expenses
      .filter(exp => {
        const expDate = exp.date ? new Date(exp.date) : null;
        return expDate && expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const monthlyChange = thisMonthTotal - lastMonthTotal;
    const monthlyChangePercent = lastMonthTotal ? (monthlyChange / lastMonthTotal) * 100 : 0;

    return {
      totalAmount,
      categoryBreakdown,
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      monthlyChange,
      monthlyChangePercent
    };
  }, [expenses]);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-[120px] mb-2" />
              <Skeleton className="h-8 w-[120px] mb-3" />
              <Skeleton className="h-4 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{formatCurrency(summaryData.totalAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All time expenses
          </p>
        </CardContent>
      </Card>
      
      {/* This Month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <AreaChart className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{formatCurrency(summaryData.thisMonth)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Current month total
          </p>
        </CardContent>
      </Card>
      
      {/* Last Month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <AreaChart className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{formatCurrency(summaryData.lastMonth)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Previous month total
          </p>
        </CardContent>
      </Card>
      
      {/* Monthly Change */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Change
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {summaryData.monthlyChange > 0 ? (
              <TrendingUp className="h-5 w-5 mr-2 text-destructive" />
            ) : (
              <TrendingDown className="h-5 w-5 mr-2 text-green-500" />
            )}
            <span className={`text-2xl font-bold ${summaryData.monthlyChange > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {formatCurrency(Math.abs(summaryData.monthlyChange))}
              <span className="text-sm ml-1">
                ({summaryData.monthlyChangePercent.toFixed(1)}%)
              </span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summaryData.monthlyChange > 0 ? 'Increase' : 'Decrease'} from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSummary;
