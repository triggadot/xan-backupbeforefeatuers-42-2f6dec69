import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import { ProductList, ProductStats, ProductCategories, ProductInventoryReport, ProductVendors, ProductAnalytics } from '@/components/products';
import { Product } from '@/types/products';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

/**
 * Products page component
 * 
 * Displays a list of products and product statistics
 * Allows navigation to product detail page
 */
const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleSelectProduct = (product: Product) => {
    navigate(`/products/${product.glide_row_id}`);
  };

  const handleCreateProduct = () => {
    navigate('/products/new');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Products"
        description="Manage your product inventory"
        actions={
          <Button onClick={handleCreateProduct}>
            Add New Product
          </Button>
        }
      />

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mb-8">
          <Tab>Product List</Tab>
          <Tab>Categories</Tab>
          <Tab>Vendors</Tab>
          <Tab>Inventory Report</Tab>
          <Tab>Analytics</Tab>
          <Tab>Statistics</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <ProductList onSelectProduct={handleSelectProduct} />
          </TabPanel>
          
          <TabPanel>
            <ProductCategories />
          </TabPanel>
          
          <TabPanel>
            <ProductVendors />
          </TabPanel>
          
          <TabPanel>
            <ProductInventoryReport />
          </TabPanel>
          
          <TabPanel>
            <ProductAnalytics />
          </TabPanel>
          
          <TabPanel>
            <ProductStats />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default ProductsPage;
