
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UnpaidProduct } from '@/types/product';

interface UnpaidInventoryCardProps {
  unpaidProducts: UnpaidProduct[];
  isLoading: boolean;
}

const UnpaidInventoryCard: React.FC<UnpaidInventoryCardProps> = ({ 
  unpaidProducts,
  isLoading
}) => {
  const totalSampleValue = unpaidProducts
    .filter(p => p.unpaid_type === 'Sample')
    .reduce((sum, product) => sum + product.unpaid_value, 0);

  const totalFrontedValue = unpaidProducts
    .filter(p => p.unpaid_type === 'Fronted')
    .reduce((sum, product) => sum + product.unpaid_value, 0);

  const totalUnpaidValue = totalSampleValue + totalFrontedValue;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unpaid Inventory</CardTitle>
          <CardDescription>Loading unpaid inventory data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[100px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unpaid Inventory</CardTitle>
        <CardDescription>
          Samples and fronted products requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <div className="text-sm text-muted-foreground mb-1">Samples</div>
              <div className="text-xl font-bold">${totalSampleValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {unpaidProducts.filter(p => p.unpaid_type === 'Sample').length} products
              </div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-sm text-muted-foreground mb-1">Fronted</div>
              <div className="text-xl font-bold">${totalFrontedValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {unpaidProducts.filter(p => p.unpaid_type === 'Fronted').length} products
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-3 bg-muted/30">
            <div className="text-sm font-medium mb-1">Total Unpaid Value</div>
            <div className="text-2xl font-bold">${totalUnpaidValue.toFixed(2)}</div>
          </div>
          
          {unpaidProducts.length > 0 && (
            <div className="border rounded-md p-3">
              <div className="text-sm font-medium mb-2">Recent Unpaid Products</div>
              <ul className="space-y-2">
                {unpaidProducts.slice(0, 3).map(product => (
                  <li key={product.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium truncate max-w-[60%]" title={product.name}>
                        {product.name}
                      </span>
                      <span>${product.unpaid_value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{product.vendor_name}</span>
                      <span>{product.unpaid_type}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/unpaid-inventory">
            Manage Unpaid Inventory
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UnpaidInventoryCard;
