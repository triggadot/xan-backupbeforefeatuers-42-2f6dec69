import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { CustomerPayment, Credit } from '@/hooks/accounts/useAccountOverview';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { ArrowDownRight, ArrowUpRight, CreditCard, Receipt } from 'lucide-react';

interface FinancialSummaryProps {
  invoices: InvoiceWithAccount[];
  payments: CustomerPayment[];
  credits: Credit[];
  totalBalance: number;
}

/**
 * Displays a comprehensive financial summary with grouped transactions
 * Shows invoices, payments, and credits in a clear, aligned format
 */
export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  invoices,
  payments,
  credits,
  totalBalance
}) => {
  // Calculate totals
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const totalPaidAmount = payments.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0);
  const totalCreditAmount = credits.reduce((sum, credit) => sum + (credit.credit_amount || 0), 0);
  
  // Sort transactions by date (newest first)
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );
  
  const sortedCredits = [...credits].sort((a, b) => 
    new Date(b.credit_date).getTime() - new Date(a.credit_date).getTime()
  );
  
  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(b.invoice_date || '').getTime() - new Date(a.invoice_date || '').getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Invoiced</div>
              <div className="flex items-center justify-between">
                <ArrowUpRight className="h-4 w-4 text-destructive" />
                <AmountDisplay 
                  amount={totalInvoiceAmount} 
                  variant="destructive" 
                  className="text-xl font-semibold" 
                />
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Received</div>
              <div className="flex items-center justify-between">
                <ArrowDownRight className="h-4 w-4 text-success" />
                <AmountDisplay 
                  amount={totalPaidAmount + totalCreditAmount} 
                  variant="success" 
                  className="text-xl font-semibold" 
                />
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
              <div className="flex items-center justify-between">
                <span className="h-4 w-4" />
                <AmountDisplay 
                  amount={totalBalance} 
                  variant={totalBalance === 0 ? 'default' : totalBalance > 0 ? 'destructive' : 'success'} 
                  className="text-xl font-semibold" 
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Transaction Timeline */}
          <div>
            <h3 className="text-lg font-medium mb-4">Transaction Timeline</h3>
            <div className="space-y-4">
              {sortedInvoices.length === 0 && sortedPayments.length === 0 && sortedCredits.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No transactions found for this account.
                </div>
              )}
              
              {/* Combine and sort all transactions by date */}
              {[
                ...sortedInvoices.map(invoice => ({
                  type: 'invoice',
                  date: invoice.invoice_date || '',
                  amount: invoice.total_amount || 0,
                  id: invoice.id,
                  number: invoice.invoice_number,
                  status: invoice.payment_status
                })),
                ...sortedPayments.map(payment => ({
                  type: 'payment',
                  date: payment.payment_date,
                  amount: payment.payment_amount || 0,
                  id: payment.id,
                  method: payment.payment_method,
                  notes: payment.notes
                })),
                ...sortedCredits.map(credit => ({
                  type: 'credit',
                  date: credit.credit_date,
                  amount: credit.credit_amount || 0,
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
