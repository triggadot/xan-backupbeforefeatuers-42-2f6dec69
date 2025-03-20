
import React, { useEffect } from 'react';
import { useUnpaidInventory } from '@/hooks/useUnpaidInventory';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnpaidInventoryList from '@/components/feature/product/UnpaidInventoryList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountDisplay } from '@/components/invoices/shared/AmountDisplay';

const UnpaidInventory: React.FC = () => {
  const { 
    unpaidProducts, 
    isLoading, 
    error, 
    fetchUnpaidInventory,
    markAsPaid,
    markAsReturned
  } = useUnpaidInventory();

  useEffect(() => {
    fetchUnpaidInventory();
  }, []); // Run once on component mount

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

  // Create wrapper functions that match expected return types
  const handleMarkAsPaid = async (productId: string): Promise<boolean> => {
    return await markAsPaid(productId);
  };

  const handleMarkAsReturned = async (productId: string): Promise<boolean> => {
    return await markAsReturned(productId);
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
              <AmountDisplay amount={totalSampleValue} variant="danger" />
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
              <AmountDisplay amount={totalFrontedValue} variant="danger" />
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
              <AmountDisplay amount={totalUnpaidValue} variant="danger" />
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
          onPay={handleMarkAsPaid}
          onReturn={handleMarkAsReturned}
        />
      )}
    </div>
  );
};

export default UnpaidInventory;
