
import React from 'react';
import { Estimate } from '@/types/estimate';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format-utils';
import { ArrowRight, Calendar, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EstimateCardProps {
  estimate: Estimate;
  onView: (estimate: Estimate) => void;
}

const EstimateCard: React.FC<EstimateCardProps> = ({ estimate, onView }) => {
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'pending':
        return 'warning';
      case 'converted':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="block transition-transform hover:translate-y-[-2px]" onClick={() => onView(estimate)}>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 truncate">Estimate #{estimate.glide_row_id?.substring(4)}</h3>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground mb-2">
                <User size={14} />
                <span className="truncate">{estimate.accountName || 'No customer'}</span>
              </div>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>{formatDate(estimate.estimate_date || estimate.created_at || '')}</span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <Badge 
                  variant={getStatusVariant(estimate.status)}
                  className="capitalize"
                >
                  {estimate.status}
                </Badge>
                
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(estimate.total_amount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimateCard;
