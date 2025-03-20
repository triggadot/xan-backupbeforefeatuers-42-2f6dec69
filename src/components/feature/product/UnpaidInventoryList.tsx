
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnpaidProduct } from '@/types/product';
import { formatCurrency } from '@/utils/format-utils';

interface UnpaidInventoryListProps {
  products: UnpaidProduct[];
  isLoading: boolean;
  onPay: (productId: string) => Promise<boolean>;
  onReturn: (productId: string) => Promise<boolean>;
}

const UnpaidInventoryList: React.FC<UnpaidInventoryListProps> = ({
  products,
  isLoading,
  onPay,
  onReturn
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/20">
        <p>No unpaid inventory found.</p>
      </div>
    );
  }

  const handlePay = async (id: string) => {
    if (confirm("Are you sure you want to mark this product as paid?")) {
      await onPay(id);
    }
  };

  const handleReturn = async (id: string) => {
    if (confirm("Are you sure you want to mark this product as returned to vendor?")) {
      await onReturn(id);
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Terms</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.vendor_name}</TableCell>
              <TableCell>
                <Badge
                  variant={product.unpaid_type === 'Sample' ? 'secondary' : 'outline'}
                >
                  {product.unpaid_type}
                </Badge>
              </TableCell>
              <TableCell>{product.quantity}</TableCell>
              <TableCell>{formatCurrency(product.cost)}</TableCell>
              <TableCell>{formatCurrency(product.unpaid_value)}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {product.terms_for_fronted_product || '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePay(product.glide_row_id)}
                  >
                    Pay
                  </Button>
                  {product.unpaid_type === 'Sample' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturn(product.glide_row_id)}
                    >
                      Return
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UnpaidInventoryList;
