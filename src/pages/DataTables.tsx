
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsView from '@/components/products/ProductsView';
import { motion } from 'framer-motion';

const DataTables: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-6"
    >
      <h1 className="text-2xl font-bold mb-6">Data Tables</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="animate-fade-in">
          <ProductsView />
        </TabsContent>
        
        <TabsContent value="accounts" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Accounts view is not implemented yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="purchase-orders" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Purchase Orders view is not implemented yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default DataTables;
