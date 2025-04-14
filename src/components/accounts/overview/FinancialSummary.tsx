import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/format';

/**
 * @deprecated This is a temporary placeholder. The original component had TypeScript errors.
 * This will be rebuilt with proper types in a future update, following the Feature-Based Architecture pattern.
 */
interface FinancialSummaryProps {
  invoices?: any[];
  payments?: any[];
  credits?: any[];
  totalBalance: number;
  isPending?: boolean;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  invoices = [],
  payments = [],
  credits = [],
  totalBalance,
  isPending = false
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Financial Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balances" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="balances" className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                <div className="text-sm text-muted-foreground">Open Invoices</div>
                <div className="font-semibold text-lg">
                  {invoices?.length || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                <div className="text-sm text-muted-foreground">Recent Payments</div>
                <div className="font-semibold text-lg">
                  {payments?.length || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                <div className="text-sm text-muted-foreground">Net Balance</div>
                <div className={`font-semibold text-lg ${totalBalance > 0 ? 'text-green-600' : totalBalance < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(totalBalance)}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="activity" className="pt-4">
            <div className="text-center text-muted-foreground text-sm py-8">
              This section is temporarily disabled due to TypeScript errors.
              It will be rebuilt in an upcoming update.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

