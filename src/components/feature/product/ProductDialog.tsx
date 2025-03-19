
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  title: string;
  product?: any;
}

interface Vendor {
  id: string;
  glide_row_id: string;
  account_name: string;
}

const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  title,
  product
}) => {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const { toast } = useToast();

  // Initialize form values when product changes
  useEffect(() => {
    if (product) {
      setFormValues({...product});
    } else {
      setFormValues({
        new_product_name: '',
        vendor_product_name: '',
        category: '',
        cost: '',
        total_qty_purchased: 1,
        purchase_notes: '',
        rowid_accounts: ''
      });
    }
  }, [product, open]);

  // Fetch vendors
  useEffect(() => {
    async function fetchVendors() {
      setIsLoadingVendors(true);
      try {
        const { data, error } = await supabase
          .from('gl_accounts')
          .select('id, glide_row_id, account_name')
          .eq('client_type', 'vendor');
          
        if (error) throw error;
        setVendors(data || []);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vendors',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingVendors(false);
      }
    }
    
    if (open) {
      fetchVendors();
    }
  }, [open, toast]);

  const handleChange = (field: string, value: unknown) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format numeric fields
    const formattedValues = {...formValues};
    if (formattedValues.cost) {
      formattedValues.cost = parseFloat(String(formattedValues.cost));
    }
    if (formattedValues.total_qty_purchased) {
      formattedValues.total_qty_purchased = parseInt(String(formattedValues.total_qty_purchased), 10);
    }
    
    // Remove id for new records
    if (!product) {
      delete formattedValues.id;
    }
    
    onSubmit(formattedValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new_product_name">Product Name</Label>
              <Input
                id="new_product_name"
                placeholder="Enter product name"
                value={formValues.new_product_name || ''}
                onChange={e => handleChange('new_product_name', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendor_product_name">Vendor Product Name</Label>
              <Input
                id="vendor_product_name"
                placeholder="Enter vendor's product name"
                value={formValues.vendor_product_name || ''}
                onChange={e => handleChange('vendor_product_name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Enter product category"
                  value={formValues.category || ''}
                  onChange={e => handleChange('category', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rowid_accounts">Vendor</Label>
                <Select 
                  value={String(formValues.rowid_accounts || '')}
                  onValueChange={value => handleChange('rowid_accounts', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.glide_row_id}>
                        {vendor.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formValues.cost || ''}
                  onChange={e => handleChange('cost', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total_qty_purchased">Quantity</Label>
                <Input
                  id="total_qty_purchased"
                  type="number"
                  placeholder="1"
                  value={formValues.total_qty_purchased || ''}
                  onChange={e => handleChange('total_qty_purchased', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purchase_notes">Notes</Label>
              <Textarea
                id="purchase_notes"
                placeholder="Additional notes about this product"
                value={formValues.purchase_notes || ''}
                onChange={e => handleChange('purchase_notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="samples"
                checked={!!formValues.samples}
                onCheckedChange={(checked) => handleChange('samples', checked)}
              />
              <Label htmlFor="samples">Sample Item</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
