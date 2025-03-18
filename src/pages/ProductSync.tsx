import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import SyncProductsButton from '@/components/sync/SyncProductsButton';
import { SyncDetailsPanel } from '@/components/sync/SyncDetailsPanel';
import { SyncProgressIndicator } from '@/components/sync/SyncProgressIndicator';
import { SyncContainer } from '@/components/sync/SyncContainer';
import { LoadingState } from '@/components/sync/LoadingState';
import { InvalidMapping } from '@/components/sync/InvalidMapping';
import { GlMapping, GlProduct, GlSyncLog, convertDbToGlProduct } from '@/types/glsync';
import { SyncLog } from '@/types/syncLog';
import { SyncLogsTable } from '@/components/sync/SyncLogsTable';

const ProductSync = () => {
  const { mappingId } = useParams();
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [products, setProducts] = useState<GlProduct[]>([]);
  const [syncLogs, setSyncLogs] = useState<GlSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (mappingId) {
      fetchMapping(mappingId);
    }
  }, [mappingId]);

  const fetchMapping = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const mappingData = {
        ...data,
        column_mappings: data.column_mappings as Record<string, {
          glide_column_name: string;
          supabase_column_name: string;
          data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
        }>
      } as GlMapping;
      
      setMapping(mappingData);
      
      if (mappingData.supabase_table === 'gl_products') {
        fetchProducts();
        fetchSyncLogs(id);
      }
    } catch (error) {
      console.error('Error fetching mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mapping details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setProducts((data || []).map(product => convertDbToGlProduct(product)));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchSyncLogs = async (id: string) => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', id)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      const logs = (data || []).map(log => ({
        ...log,
        status: log.status as "started" | "processing" | "completed" | "failed"
      })) as GlSyncLog[];
      
      setSyncLogs(logs);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSyncComplete = () => {
    fetchProducts();
    if (mappingId) {
      fetchSyncLogs(mappingId);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!mapping) {
    return <InvalidMapping onBack={() => navigate('/sync/mappings')} />;
  }

  if (mapping.supabase_table !== 'gl_products') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Mapping Type</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is only for Products mappings.</p>
          <Button onClick={() => navigate('/sync/mappings')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mappings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <SyncContainer>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/sync/mappings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">Product Sync</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Sync products between Glide and Supabase
          </p>
        </div>
        
        <SyncProductsButton 
          mapping={mapping}
          onSyncComplete={handleSyncComplete}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="logs">Sync Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="pt-4">
              {isLoadingProducts ? (
                <LoadingState />
              ) : products.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>No products have been synced yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <Card key={product.id}>
                      <CardHeader>
                        <CardTitle>{product.new_product_name || product.vendor_product_name || 'Unnamed Product'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Glide ID</dt>
                            <dd className="text-sm">{product.glide_row_id}</dd>
                          </div>
                          {product.category && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                              <dd className="text-sm">{product.category}</dd>
                            </div>
                          )}
                          {product.cost !== null && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Cost</dt>
                              <dd className="text-sm">${product.cost}</dd>
                            </div>
                          )}
                          {product.product_purchase_date && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Purchase Date</dt>
                              <dd className="text-sm">{new Date(product.product_purchase_date).toLocaleDateString()}</dd>
                            </div>
                          )}
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                  {products.length > 5 && (
                    <Button variant="outline" className="w-full">
                      View All Products ({products.length})
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="pt-4">
              {isLoadingLogs ? (
                <LoadingState />
              ) : (
                <SyncLogsTable 
                  logs={syncLogs} 
                  isLoading={isLoadingLogs} 
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <SyncDetailsPanel mapping={mapping} />
          <div className="mt-6">
            <SyncProgressIndicator mapping={mapping} />
          </div>
        </div>
      </div>
    </SyncContainer>
  );
};

export default ProductSync;
