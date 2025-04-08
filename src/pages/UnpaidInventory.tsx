import React, { useEffect, useState } from 'react';
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnpaidInventoryList from '@/components/feature/product/UnpaidInventoryList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountDisplay } from '@/components/invoices/shared/AmountDisplay';
import { UnpaidProduct } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UnpaidInventory: React.FC = () => {
  const { unpaidInventory, isLoading, error, refreshDashboard } = useBusinessDashboard();
  const [unpaidProducts, setUnpaidProducts] = useState<UnpaidProduct[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Combine samples and fronted products
    if (unpaidInventory) {
      setUnpaidProducts([...unpaidInventory.samples, ...unpaidInventory.fronted]);
    }
  }, [unpaidInventory]);

  const fetchUnpaidInventory = async () => {
    refreshDashboard();
  };

  const markAsPaid = async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gl_products')
        .update({
          samples: false,
          fronted: false,
          samples_or_fronted: false,
          updated_at: new Date().toISOString()
        })
        .eq('glide_row_id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product marked as paid",
      });
      
      // Update local state
      setUnpaidProducts(prev => prev.filter(p => p.product_id !== productId));
      return true;
    } catch (err) {
      console.error('Error marking product as paid:', err);
      toast({
        title: "Error",
        description: "Failed to mark product as paid",
        variant: "destructive"
      });
      return false;
    }
  };

  const markAsReturned = async (productId: string): Promise<boolean> => {
    try {
      // Using the new inventory calculation function would be good here
      // but for now we'll just zero out the quantity
      const { error } = await supabase
        .from('gl_products')
        .update({
          total_qty_purchased: 0,
          samples: false,
          fronted: false,
          samples_or_fronted: false,
          updated_at: new Date().toISOString()
        })
        .eq('glide_row_id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product marked as returned",
      });
      
      // Update local state
      setUnpaidProducts(prev => prev.filter(p => p.product_id !== productId));
      return true;
    } catch (err) {
      console.error('Error marking product as returned:', err);
      toast({
        title: "Error",
        description: "Failed to mark product as returned",
        variant: "destructive"
      });
      return false;
    }
  };

  const totalSampleValue = unpaidProducts
    .filter(p => p.unpaid_type === 'Sample')
    .reduce((sum, product) => sum + product.unpaid_value, 0);

  const totalFrontedValue = unpaidProducts
    .filter(p => p.unpaid_type === 'Fronted')
    .reduce((sum, product) => sum + product.unpaid_value, 0);

  const totalUnpaidValue = totalSampleValue + totalFrontedValue;

  const handleRefresh = () => {
    fetchUnpaidInventory();
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Unpaid Inventory</h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh unpaid inventory"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AmountDisplay amount={totalSampleValue} variant="destructive" />
            </div>
            <p className="text-xs text-muted-foreground">
              {unpaidProducts.filter(p => p.unpaid_type === 'Sample').length} products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fronted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AmountDisplay amount={totalFrontedValue} variant="destructive" />
            </div>
            <p className="text-xs text-muted-foreground">
              {unpaidProducts.filter(p => p.unpaid_type === 'Fronted').length} products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Unpaid Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AmountDisplay amount={totalUnpaidValue} variant="destructive" />
            </div>
            <p className="text-xs text-muted-foreground">
              {unpaidProducts.length} products total
            </p>
          </CardContent>
        </Card>
      </div>
      
      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>Error loading unpaid inventory: {error}</p>
        </div>
      ) : (
        <UnpaidInventoryList 
          products={unpaidProducts}
          isLoading={isLoading}
          onPay={markAsPaid}
          onReturn={markAsReturned}
        />
      )}
    </div>
  );
};

export default UnpaidInventory;
