
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { PurchaseOrderWithVendor } from '@/types/purchaseOrder';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrderWithVendor[];
  onView: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft': return 'bg-gray-200 text-gray-800';
    case 'sent': return 'bg-blue-100 text-blue-800';
    case 'partial': return 'bg-yellow-100 text-yellow-800';
    case 'paid': 
    case 'complete': return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ purchaseOrders, onView }) => {
  if (!purchaseOrders.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No Purchase Orders</h2>
          <p className="text-muted-foreground">You haven't created any purchase orders yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">#{po.number}</TableCell>
                  <TableCell>{formatDate(po.date)}</TableCell>
                  <TableCell>{po.vendorName}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(po.status)} variant="outline">
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(po.total)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(po.balance)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onView(po.id)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderList;
