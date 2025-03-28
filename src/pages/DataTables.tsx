
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link2, RefreshCw } from 'lucide-react';
import ProductsView from '@/components/products/ProductsView';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { RelationshipMapper } from '@/components/sync/RelationshipMapper';
import { useGlSync } from '@/hooks/useGlSync';

const DataTables: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [mappingResults, setMappingResults] = useState<any>(null);
  const { mapAllRelationships, isRelationshipMapping } = useGlSync();
  const { toast } = useToast();

  const handleMapRelationships = async () => {
    setMappingResults(null);
    try {
      const result = await mapAllRelationships();
      
      if (!result || result.success === false) {
        throw new Error(result?.error || 'Unknown error mapping relationships');
      }
      
      // Set the mapping results to display them
      setMappingResults(result.result);
      
      // Show success toast with information
      toast({
        title: 'Relationships Mapped',
        description: `Successfully mapped relationships across tables.`,
      });
      
      console.log('Mapping result:', result);
    } catch (error) {
      console.error('Error mapping relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to map relationships: ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Tables</h1>
        <Button 
          onClick={handleMapRelationships} 
          disabled={isRelationshipMapping}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isRelationshipMapping ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          Map Relationships
        </Button>
      </div>
      
      {mappingResults && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-green-800 mb-2">Mapping Results</h3>
            <pre className="text-xs overflow-auto bg-white p-4 rounded border max-h-48">
              {JSON.stringify(mappingResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      
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
      
      <div className="mt-8">
        <RelationshipMapper />
      </div>
    </motion.div>
  );
};

export default DataTables;
