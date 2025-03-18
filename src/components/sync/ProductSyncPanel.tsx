
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlMapping } from '@/types/glsync';
import SyncErrorDisplay from './SyncErrorDisplay';

interface ProductSyncPanelProps {
  mapping: GlMapping;
  onSyncComplete?: () => void;
}

const ProductSyncPanel: React.FC<ProductSyncPanelProps> = ({ mapping, onSyncComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success?: boolean;
    recordsProcessed?: number;
    failedRecords?: number;
    errors?: any[];
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      const result = await glSyncApi.syncData(mapping.connection_id, mapping.id);
      setSyncResult(result);
      
      if (result.success) {
        toast({
          title: 'Sync completed',
          description: `Successfully processed ${result.recordsProcessed} records`,
        });
      } else {
        toast({
          title: 'Sync had issues',
          description: result.error || `Processed ${result.recordsProcessed} records with ${result.failedRecords} failures`,
          variant: 'destructive',
        });
      }
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      setSyncResult({ success: false, error: error.message });
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Products Sync
        </CardTitle>
        <CardDescription>
          Synchronize products from Glide to Supabase with additional validation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Glide Table</h4>
              <p className="text-sm text-gray-500">{mapping.glide_table}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Supabase Table</h4>
              <p className="text-sm text-gray-500">{mapping.supabase_table}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Sync Direction</h4>
            <p className="text-sm text-gray-500">
              {mapping.sync_direction === 'to_supabase' 
                ? 'Glide to Supabase' 
                : mapping.sync_direction === 'to_glide' 
                  ? 'Supabase to Glide' 
                  : 'Bidirectional'}
            </p>
          </div>
          
          {syncResult && (
            <div className="mt-4">
              {syncResult.success ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Sync Completed</AlertTitle>
                  <AlertDescription>
                    Successfully processed {syncResult.recordsProcessed} records
                    {syncResult.failedRecords && syncResult.failedRecords > 0 && (
                      <span className="text-amber-600"> with {syncResult.failedRecords} failures</span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sync Failed</AlertTitle>
                  <AlertDescription>
                    {syncResult.error || 'An error occurred during synchronization'}
                  </AlertDescription>
                </Alert>
              )}
              
              {syncResult.errors && syncResult.errors.length > 0 && (
                <SyncErrorDisplay 
                  errors={syncResult.errors} 
                  className="mt-4"
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSync} 
          disabled={isLoading || !mapping.enabled}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync Products'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductSyncPanel;
