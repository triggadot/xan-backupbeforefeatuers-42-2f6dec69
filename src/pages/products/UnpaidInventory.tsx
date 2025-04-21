import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, Title, Text, Grid } from '@tremor/react';
import { useUnpaidInventory } from '@/hooks/products/useUnpaidInventory';
import { UnpaidInventoryList } from '@/components/new/products/unpaid-inventory-list';
import { UnpaidInventoryStats } from '@/components/new/products/unpaid-inventory-stats';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/products';

/**
 * UnpaidInventory page component
 * 
 * Displays a list of inventory items that have been received but not yet paid for
 * Includes statistics and filtering capabilities
 */
const UnpaidInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: unpaidItems, isLoading, error } = useUnpaidInventory();

  const handleSelectProduct = (product: Product) => {
    navigate(`/products/${product.glide_row_id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error loading unpaid inventory: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Unpaid Inventory"
        description="Manage inventory items that have been received but not paid for"
        actions={
          <Button onClick={() => navigate('/purchase-orders')}>
            View All Purchase Orders
          </Button>
        }
      />

      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Unpaid Inventory Summary</Title>
          {unpaidItems && <UnpaidInventoryStats items={unpaidItems} />}
        </Card>
        
        <Card>
          <Title>Unpaid Items by Category</Title>
          <Text className="mt-2">Breakdown of unpaid inventory by product category</Text>
          {/* Category breakdown visualization would go here */}
        </Card>
      </Grid>

      <Card className="mb-6">
        <Title>Unpaid Inventory Items</Title>
        <Text className="mb-4">Products received but payment is pending</Text>
        {unpaidItems && <UnpaidInventoryList items={unpaidItems} onSelectProduct={handleSelectProduct} />}
      </Card>
    </div>
  );
};

export default UnpaidInventoryPage;
