
import React from 'react';
import { CalendarIcon, CreditCard, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Estimate } from '@/types/estimate';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-utils';
import { formatDate } from '@/utils/format-utils';

interface EstimateCardProps {
  estimate: Estimate;
  onView: (estimate: Estimate) => void;
}

const EstimateCard: React.FC<EstimateCardProps> = ({ estimate, onView }) => {
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="transition-all hover:shadow-md w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Estimate #{estimate.glide_row_id?.substring(4)}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <CalendarIcon className="mr-1 h-3 w-3" /> 
              {estimate.estimate_date 
                ? format(new Date(estimate.estimate_date), 'MMM d, yyyy')
                : 'No date'}
            </p>
          </div>
          <Badge variant={getStatusBadge(estimate.status)}>
            {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-start">
            <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{estimate.accountName || 'No customer'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-sm font-medium">{formatCurrency(estimate.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-sm font-medium">{formatCurrency(estimate.balance)}</p>
            </div>
          </div>
          
          <div className="flex items-center mt-2 text-sm">
            {estimate.total_credits > 0 && (
              <div className="flex items-center text-muted-foreground mr-4">
                <CreditCard className="h-3 w-3 mr-1" /> 
                <span className="text-xs">{formatCurrency(estimate.total_credits)} credited</span>
              </div>
            )}
            
            {estimate.rowid_invoices && (
              <div className="flex items-center text-muted-foreground">
                <FileText className="h-3 w-3 mr-1" /> 
                <span className="text-xs">Converted to invoice</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          Created: {formatDate(estimate.created_at)}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onView(estimate)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EstimateCard;
