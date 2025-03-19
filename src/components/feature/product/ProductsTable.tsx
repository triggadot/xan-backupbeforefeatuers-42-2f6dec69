
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/mapping-utils';

export interface ProductsTableProps {
  products: Product[];
  onEdit: (product: any) => void;
  onViewDetails: (product: any) => void;
  deleteProduct: (id: string) => Promise<boolean>;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products, 
  onEdit, 
  onViewDetails,
  deleteProduct
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name || 'Unnamed Product'}</TableCell>
                <TableCell>{product.vendorName || 'Unknown Vendor'}</TableCell>
                <TableCell>{product.category || 'Uncategorized'}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                <TableCell className="text-right">{product.totalQtyPurchased || 0}</TableCell>
                <TableCell>
                  {product.inStock > 0 ? (
                    <Badge variant="default" className="bg-green-500">In Stock</Badge>
                  ) : (
                    <Badge variant="outline">Out of Stock</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onViewDetails(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
