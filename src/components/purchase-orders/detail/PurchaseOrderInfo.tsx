
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format-utils';
import { PurchaseOrder } from '@/types/purchaseOrder';

interface PurchaseOrderInfoProps {
  purchaseOrder: PurchaseOrder;
  onAddPayment: () => void;
}

export const PurchaseOrderInfo = ({ purchaseOrder, onAddPayment }: PurchaseOrderInfoProps) => {
  const isPaid = purchaseOrder.status === 'complete' || 
                (purchaseOrder.balance && purchaseOrder.balance <= 0);
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Purchase Order Info</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Purchase Order Number</p>
          <p className="font-medium">{purchaseOrder.number}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="font-medium">
            {purchaseOrder.date instanceof Date 
              ? purchaseOrder.date.toLocaleDateString() 
              : new Date(purchaseOrder.date || purchaseOrder.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{purchaseOrder.status}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="font-medium">{formatCurrency(purchaseOrder.total_amount)}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Amount Paid</p>
          <p className="font-medium">{formatCurrency(purchaseOrder.total_paid)}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="font-medium font-bold">{formatCurrency(purchaseOrder.balance)}</p>
        </div>
      </div>
      
      {!isPaid && (
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onAddPayment}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      )}
    </Card>
  );
};
