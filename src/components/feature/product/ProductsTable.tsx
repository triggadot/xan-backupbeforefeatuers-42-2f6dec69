
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { TableActions } from '@/components/common/table/TableActions';
import { formatCurrency } from '@/utils/format-utils';
import { Card } from '@/components/ui/card';

interface ProductsTableProps {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products,
  onEdit,
  onDelete
}) => {
  if (products.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No products found. Create your first product by clicking "New Product" button above.</p>
      </Card>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product'}
                </TableCell>
                <TableCell>{product.category || '—'}</TableCell>
                <TableCell>{product.cost ? formatCurrency(product.cost) : '—'}</TableCell>
                <TableCell>{product.total_qty_purchased ?? '—'}</TableCell>
                <TableCell>
                  {product.cost && product.total_qty_purchased
                    ? formatCurrency(product.cost * product.total_qty_purchased)
                    : '—'}
                </TableCell>
                <TableCell>
                  {product.rowid_accounts ? <VendorName vendorId={product.rowid_accounts} /> : '—'}
                </TableCell>
                <TableCell>
                  <TableActions
                    row={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Helper component to display vendor name
const VendorName: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const [vendorName, setVendorName] = React.useState<string>('Loading...');
  
  React.useEffect(() => {
    async function fetchVendorName() {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('gl_accounts')
          .select('account_name')
          .eq('glide_row_id', vendorId)
          .single();
          
        if (error) throw error;
        setVendorName(data?.account_name || 'Unknown Vendor');
      } catch (error) {
        console.error('Error fetching vendor name:', error);
        setVendorName('Unknown Vendor');
      }
    }
    
    fetchVendorName();
  }, [vendorId]);
  
  return <span>{vendorName}</span>;
};

export default ProductsTable;
