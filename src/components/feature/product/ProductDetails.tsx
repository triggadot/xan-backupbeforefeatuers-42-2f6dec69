
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format-utils';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Info, 
  Package, 
  ShoppingCart, 
  Tag, 
  User 
} from 'lucide-react';
import { format } from 'date-fns';

interface ProductDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onEdit?: (product: any) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  open, 
  onOpenChange, 
  product, 
  onEdit 
}) => {
  const [vendorName, setVendorName] = React.useState<string>('');
  
  React.useEffect(() => {
    if (product?.rowid_accounts) {
      fetchVendorName(product.rowid_accounts);
    }
  }, [product]);
  
  const fetchVendorName = async (vendorId: string) => {
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
  };
  
  if (!product) return null;
  
  const totalValue = product.cost && product.total_qty_purchased 
    ? product.cost * product.total_qty_purchased 
    : 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {product.display_name || product.new_product_name || product.vendor_product_name || 'Product Details'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {product.samples && (
              <Badge variant="outline" className="bg-blue-50">Sample</Badge>
            )}
            {product.fronted && (
              <Badge variant="outline" className="bg-amber-50">Fronted</Badge>
            )}
            {product.miscellaneous_items && (
              <Badge variant="outline" className="bg-purple-50">Miscellaneous</Badge>
            )}
            {product.category && (
              <Badge variant="outline" className="bg-green-50">{product.category}</Badge>
            )}
          </div>
          
          {/* Main info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
            <InfoItem icon={Package} label="Product Name" value={product.new_product_name} />
            <InfoItem icon={Tag} label="Vendor Product Name" value={product.vendor_product_name} />
            <InfoItem 
              icon={ShoppingCart} 
              label="Cost" 
              value={product.cost ? formatCurrency(product.cost) : '—'} 
            />
            <InfoItem icon={Info} label="Quantity" value={product.total_qty_purchased?.toString()} />
            <InfoItem 
              icon={Tag} 
              label="Total Value" 
              value={totalValue ? formatCurrency(totalValue) : '—'} 
            />
            <InfoItem icon={User} label="Vendor" value={vendorName} />
            {product.product_purchase_date && (
              <InfoItem 
                icon={Calendar} 
                label="Purchase Date" 
                value={format(new Date(product.product_purchase_date), "PPP")} 
              />
            )}
            {product.created_at && (
              <InfoItem 
                icon={Clock} 
                label="Created" 
                value={format(new Date(product.created_at), "PPP")} 
              />
            )}
          </div>
          
          {/* Notes */}
          {product.purchase_notes && (
            <div className="space-y-2">
              <h3 className="font-medium">Purchase Notes</h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {product.purchase_notes}
              </div>
            </div>
          )}
          
          {/* Fronted terms */}
          {product.fronted && product.terms_for_fronted_product && (
            <div className="space-y-2">
              <h3 className="font-medium">Fronted Terms</h3>
              <div className="text-sm text-gray-600 bg-amber-50 p-3 rounded-md">
                {product.terms_for_fronted_product}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {onEdit && (
            <Button onClick={() => {
              onEdit(product);
              onOpenChange(false);
            }}>
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoItem: React.FC<{ icon: React.ElementType; label: string; value?: string }> = ({ 
  icon: Icon, 
  label, 
  value 
}) => {
  if (!value) return null;
  
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
};

export default ProductDetails;
