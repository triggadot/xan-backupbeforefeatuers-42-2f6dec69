
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EstimateWithDetails, EstimateFilters } from '@/types/estimate';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EstimateListProps {
  estimates: EstimateWithDetails[];
  isLoading?: boolean;
  onFilterChange?: (filters: EstimateFilters) => void;
}

export const EstimateList: React.FC<EstimateListProps> = ({
  estimates,
  isLoading = false,
  onFilterChange,
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'draft' | 'converted'>('all');
  
  // Apply filters
  const filteredEstimates = estimates.filter(estimate => {
    if (statusFilter === 'all') return true;
    return estimate.status === statusFilter;
  });

  const handleStatusFilterChange = (status: 'all' | 'pending' | 'draft' | 'converted') => {
    setStatusFilter(status);
    if (onFilterChange) {
      onFilterChange({ status: status === 'all' ? undefined : status });
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/estimates/${id}`);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Converted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  return (
    <Card className="p-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Estimates</h2>

        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEstimates.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg font-medium text-gray-500">No estimates found</p>
          <p className="text-sm text-gray-400">Create a new estimate to get started</p>
          <Button className="mt-4" onClick={() => navigate('/estimates/new')}>Create Estimate</Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstimates.map((estimate) => (
                <TableRow 
                  key={estimate.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(estimate.id)}
                >
                  <TableCell className="font-medium">
                    {`EST-${estimate.id?.substring(0, 6)}`}
                  </TableCell>
                  <TableCell>{formatDate(estimate.estimate_date)}</TableCell>
                  <TableCell>{estimate.account?.account_name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(estimate.total_amount || 0)}</TableCell>
                  <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
