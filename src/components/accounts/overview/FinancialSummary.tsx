import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/format";

/**
 * @deprecated This is a temporary placeholder. The original component had TypeScript errors.
 * This will be rebuilt with proper types in a future update.
 */
interface FinancialSummaryProps {
  accountName?: string;
  customerBalance: number;
  vendorBalance: number;
  totalBalance: number;
  allInvoices: any[];
  allPayments: any[];
  allCredits: any[];
  isPending?: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  accountName,
  customerBalance,
  vendorBalance,
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
                <div className="text-sm text-muted-foreground">Customer Balance</div>
                <div className={`font-semibold text-lg ${customerBalance > 0 ? 'text-green-600' : ''}`}>
                  {formatCurrency(customerBalance)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                <div className="text-sm text-muted-foreground">Vendor Balance</div>
                <div className={`font-semibold text-lg ${vendorBalance < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(vendorBalance)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                <div className="text-sm text-muted-foreground">Net Balance</div>
                <div className={`font-semibold text-lg ${totalBalance > 0 ? 'text-green-600' : totalBalance < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(totalBalance)}
                </div>
              </div>
                  id: credit.id,
                  notes: credit.notes
                }))
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10) // Show only the 10 most recent transactions
                .map((transaction, index) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="flex items-start gap-4">
                    <div className="min-w-[100px] text-sm text-muted-foreground">
                      {transaction.date ? format(new Date(transaction.date), 'MMM d, yyyy') : '-'}
                    </div>
                    
                    <div className={`
                      rounded-full p-2 
                      ${transaction.type === 'invoice' ? 'bg-red-100' : 
                        transaction.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'}
                    `}>
                      {transaction.type === 'invoice' ? (
                        <ArrowUpRight className={`h-4 w-4 ${transaction.type === 'invoice' ? 'text-red-600' : 'text-green-600'}`} />
                      ) : transaction.type === 'payment' ? (
                        <CreditCard className="h-4 w-4 text-green-600" />
                      ) : (
                        <Receipt className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {transaction.type === 'invoice' ? (
                            <>Invoice #{transaction.number}</>
                          ) : transaction.type === 'payment' ? (
                            <>Payment ({transaction.method || 'Other'})</>
                          ) : (
                            <>Credit</>
                          )}
                        </div>
                        <AmountDisplay 
                          amount={transaction.amount} 
                          variant={transaction.type === 'invoice' ? 'destructive' : 'success'} 
                          className="font-medium" 
                        />
                      </div>
                      
                      {(transaction.type === 'payment' || transaction.type === 'credit') && transaction.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {transaction.notes}
                        </div>
                      )}
                      
                      {transaction.type === 'invoice' && transaction.status && (
                        <div className={`
                          text-xs px-2 py-0.5 rounded-full inline-block mt-1
                          ${transaction.status.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 
                            transaction.status.toLowerCase() === 'overdue' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}
                        `}>
                          {transaction.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
