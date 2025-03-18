
import React from 'react';
import { PurchaseOrder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/mapping-utils';
import { ArrowRight, Calendar, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PurchaseOrderCardProps {
  purchaseOrder: PurchaseOrder;
}

const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({ purchaseOrder }) => {
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'received':
        return 'default';
      case 'partial':
        return 'warning';
      case 'complete':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link to={`/purchase-orders/${purchaseOrder.id}`} className="block transition-transform hover:translate-y-[-2px]">
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 truncate">PO #{purchaseOrder.number}</h3>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground mb-2">
                <User size={14} />
                <span className="truncate">{purchaseOrder.accountName}</span>
              </div>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>{formatDate(purchaseOrder.date)}</span>
                {purchaseOrder.dueDate && (
                  <>
                    <ArrowRight size={14} />
                    <span>{formatDate(purchaseOrder.dueDate)}</span>
                  </>
                )}
              </div>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground">
                <FileText size={14} />
                <span>{purchaseOrder.lineItems.length} items</span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <Badge 
                  variant={getStatusVariant(purchaseOrder.status)}
                  className="capitalize"
                >
                  {purchaseOrder.status}
                </Badge>
                
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(purchaseOrder.total)}
                  </div>
                  {purchaseOrder.balance > 0 && purchaseOrder.amountPaid > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(purchaseOrder.amountPaid)} paid
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PurchaseOrderCard;
