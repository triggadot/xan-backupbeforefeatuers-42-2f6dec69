import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface EstimateLineItem {
  id: string;
  description: string;
  qty: number;
  unit_price: number;
  rowid_products?: string;
  product_name?: string;
}

interface Estimate {
  id: string;
  glide_row_id: string;
  estimate_number: string;
  estimate_date: string;
  valid_until?: string;
  status?: string;
  total_amount: number;
  is_a_sample: boolean;
  lines?: EstimateLineItem[];
}

interface SampleEstimatesTableProps {
  estimates: Estimate[];
}

/**
 * Displays a table of sample estimates with expandable rows to show product line items
 */
export const SampleEstimatesTable: React.FC<SampleEstimatesTableProps> = ({ estimates }) => {
  const [expandedEstimates, setExpandedEstimates] = useState<Record<string, boolean>>({});

  const toggleExpand = (estimateId: string) => {
    setExpandedEstimates(prev => ({
      ...prev,
      [estimateId]: !prev[estimateId]
    }));
  };

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (estimates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sample estimates found for this account.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Estimate #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map(estimate => (
            <React.Fragment key={estimate.id}>
              <TableRow className="hover:bg-muted/50">
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleExpand(estimate.id)}
                    className="h-8 w-8"
                  >
                    {expandedEstimates[estimate.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{estimate.estimate_number}</TableCell>
                <TableCell>{estimate.estimate_date ? format(new Date(estimate.estimate_date), 'MMM d, yyyy') : '-'}</TableCell>
                <TableCell>{estimate.valid_until ? format(new Date(estimate.valid_until), 'MMM d, yyyy') : '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getStatusColor(estimate.status)}`}>
                    {estimate.status || 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AmountDisplay amount={estimate.total_amount || 0} />
                </TableCell>
                <TableCell>
                  <Link to={`/estimates/${estimate.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={16} />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
              
              {/* Expanded line items */}
              {expandedEstimates[estimate.id] && estimate.lines && estimate.lines.length > 0 && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={7} className="p-0">
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-medium mb-2">Product Line Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>UID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estimate.lines.map((line, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs">
                                {line.glide_row_id?.substring(0, 8) || `EST-${index}`}
                              </TableCell>
                              <TableCell>{line.product_name || 'Custom Item'}</TableCell>
                              <TableCell>{line.description}</TableCell>
                              <TableCell className="text-right">{line.qty}</TableCell>
                              <TableCell className="text-right">
                                <AmountDisplay amount={line.unit_price || 0} />
                              </TableCell>
                              <TableCell className="text-right">
                                <AmountDisplay amount={(line.qty || 0) * (line.unit_price || 0)} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
