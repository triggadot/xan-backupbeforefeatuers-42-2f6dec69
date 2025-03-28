
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link2, RefreshCw } from 'lucide-react';
import ProductsView from '@/components/products/ProductsView';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DataTables: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [isMapping, setIsMapping] = useState(false);
  const { toast } = useToast();

  const handleMapRelationships = async () => {
    setIsMapping(true);
    try {
      // Call the PostgreSQL function to map relationships
      const { data, error } = await supabase.rpc('md_glsync_map_all_relationships');
      
      if (error) {
        throw error;
      }
      
      // Show success toast with information
      toast({
        title: 'Relationships Mapped',
        description: `Mapped ${data.total_mapped} relationships across ${Object.keys(data.tables_processed).length} tables.`,
      });
      
      console.log('Mapping result:', data);
    } catch (error) {
      console.error('Error mapping relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to map relationships: ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setIsMapping(false);
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
          disabled={isMapping}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isMapping ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          Map Relationships
        </Button>
      </div>
      
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
