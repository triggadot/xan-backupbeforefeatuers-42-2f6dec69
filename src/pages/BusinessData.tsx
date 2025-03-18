
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountsList from '@/components/business/AccountsList';
import ProductsList from '@/components/business/ProductsList';

const BusinessData: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Business Data</h1>
      
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <AccountsList />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessData;
