
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Database, ArrowRight, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import SyncErrorDisplay from './SyncErrorDisplay';
import { useGlSync } from '@/hooks/useGlSync';

interface ProductSyncPanelProps {
  mapping: GlMapping;
  onSyncComplete?: () => void;
}

const ProductSyncPanel: React.FC<ProductSyncPanelProps> = ({ mapping, onSyncComplete }) => {
  const { syncData, isLoading, syncResult } = useGlSync();
  
  const handleSync = async () => {
    if (!mapping.enabled) return;
    
    const result = await syncData(mapping.connection_id, mapping.id);
    
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  const getSyncDirectionIcon = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return <ArrowRight className="h-5 w-5 mr-2 text-blue-500" />;
      case 'to_glide':
        return <ArrowLeft className="h-5 w-5 mr-2 text-green-500" />;
      case 'both':
        return <ArrowRightLeft className="h-5 w-5 mr-2 text-purple-500" />;
      default:
        return null;
    }
  };

  const getSyncDirectionText = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return 'Glide to Supabase';
      case 'to_glide':
        return 'Supabase to Glide';
      case 'both':
        return 'Bidirectional';
      default:
        return 'Unknown';
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
          Synchronize products between Glide and Supabase with additional validation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Glide Table</h4>
              <p className="text-sm text-gray-500">{mapping.glide_table_display_name || mapping.glide_table}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Supabase Table</h4>
              <p className="text-sm text-gray-500">{mapping.supabase_table}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Sync Direction</h4>
            <div className="flex items-center">
              {getSyncDirectionIcon()}
              <p className="text-sm text-gray-500">
                {getSyncDirectionText()}
              </p>
            </div>
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
                  syncErrors={syncResult.errors} 
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
