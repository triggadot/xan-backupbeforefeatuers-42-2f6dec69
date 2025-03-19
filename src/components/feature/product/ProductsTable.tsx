
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
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface ProductsTableProps {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onViewDetails?: (product: any) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products,
  onEdit,
  onDelete,
  onViewDetails
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
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Cost</TableHead>
              <TableHead className="hidden md:table-cell">Quantity</TableHead>
              <TableHead className="hidden sm:table-cell">Total Value</TableHead>
              <TableHead className="hidden lg:table-cell">Vendor</TableHead>
              <TableHead className="hidden xl:table-cell">Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product.id}
                className={onViewDetails ? "cursor-pointer" : ""}
                onClick={onViewDetails ? () => onViewDetails(product) : undefined}
              >
                <TableCell className="font-medium">
                  <div>
                    {product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product'}
                  </div>
                  <div className="text-xs text-muted-foreground md:hidden">
                    {product.category && <span className="mr-2">{product.category}</span>}
                    {product.cost && <span>{formatCurrency(product.cost)}</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{product.category || '—'}</TableCell>
                <TableCell className="hidden md:table-cell">{product.cost ? formatCurrency(product.cost) : '—'}</TableCell>
                <TableCell className="hidden md:table-cell">{product.total_qty_purchased ?? '—'}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {product.cost && product.total_qty_purchased
                    ? formatCurrency(product.cost * product.total_qty_purchased)
                    : '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.rowid_accounts ? <VendorName vendorId={product.rowid_accounts} /> : '—'}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex flex-col gap-1">
                    {product.samples && (
                      <Badge variant="outline" className="bg-blue-50">Sample</Badge>
                    )}
                    {product.fronted && (
                      <Badge variant="outline" className="bg-amber-50">Fronted</Badge>
                    )}
                    {product.miscellaneous_items && (
                      <Badge variant="outline" className="bg-purple-50">Misc</Badge>
                    )}
                  </div>
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
