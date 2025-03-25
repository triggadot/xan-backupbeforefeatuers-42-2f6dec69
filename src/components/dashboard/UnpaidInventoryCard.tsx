
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnpaidProduct } from '@/types/product';
import { useNavigate } from 'react-router-dom';
import { AmountDisplay } from '@/components/invoices/shared/AmountDisplay';

interface UnpaidInventoryCardProps {
  unpaidProducts: UnpaidProduct[];
  isLoading: boolean;
}

const UnpaidInventoryCard: React.FC<UnpaidInventoryCardProps> = ({
  unpaidProducts,
  isLoading
}) => {
  const navigate = useNavigate();
  
  const totalSampleValue = unpaidProducts
    .filter(p => p.unpaid_type === 'Sample')
    .reduce((sum, product) => sum + product.unpaid_value, 0);

  const totalFrontedValue = unpaidProducts
    .filter(p => p.unpaid_type === 'Fronted')
    .reduce((sum, product) => sum + product.unpaid_value, 0);

  const handleViewAll = () => {
    navigate('/unpaid-inventory');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Unpaid Inventory
        </CardTitle>
        <CardDescription>
          Samples and fronted products
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : unpaidProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground h-full flex items-center justify-center">
            <p>No unpaid inventory found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-secondary/20 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">Samples</p>
                <p className="text-lg font-bold">
                  <AmountDisplay 
                    amount={totalSampleValue} 
                    variant="destructive"
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  {unpaidProducts.filter(p => p.unpaid_type === 'Sample').length} products
                </p>
              </div>
              <div className="bg-secondary/20 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">Fronted</p>
                <p className="text-lg font-bold">
                  <AmountDisplay 
                    amount={totalFrontedValue} 
                    variant="destructive"
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  {unpaidProducts.filter(p => p.unpaid_type === 'Fronted').length} products
                </p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {unpaidProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate max-w-[200px]" title={product.name}>
                        {product.name}
                      </h4>
                      <Badge variant={product.unpaid_type === 'Sample' ? 'secondary' : 'outline'}>
                        {product.unpaid_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{product.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <AmountDisplay 
                      amount={product.unpaid_value} 
                      variant="destructive"
                    />
                  </div>
                </div>
              ))}
              
              {unpaidProducts.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{unpaidProducts.length - 5} more items
                </p>
              )}
            </div>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleViewAll}
              >
                View All Unpaid Inventory
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnpaidInventoryCard;
