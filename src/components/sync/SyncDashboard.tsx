
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { supabase } from '@/integrations/supabase/client';
import { ActiveMappingCard } from './overview/ActiveMappingCard';
import SyncMetricsCard from './overview/SyncMetricsCard';
import { SyncLogsList } from './logs/SyncLogsList';

const SyncDashboard = () => {
  const [mappings, setMappings] = useState([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(true);
  const { syncData } = useGlSync();
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Use the full hook return values
  const { 
    allSyncStatuses,
    recentLogs,
    syncStats,
    isLoading,
    hasError,
    errorMessage,
    refreshData
  } = useGlSyncStatus();

  const fetchMappings = useCallback(async () => {
    setIsLoadingMappings(true);
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: 'Error fetching mappings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMappings(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMappings();
    refreshData();
    
    // Set up realtime subscription for mappings
    const mappingsChannel = supabase
      .channel('gl_mappings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => {
          fetchMappings();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(mappingsChannel);
    };
  }, [fetchMappings, refreshData]);

  const handleSync = async (connectionId: string, mappingId: string) => {
    setIsSyncing(prev => ({ ...prev, [mappingId]: true }));
    
    try {
      const result = await syncData(connectionId, mappingId);
      
      if (result.success) {
        toast({
          title: 'Sync started',
          description: 'The synchronization process has been initiated.',
        });
        
        setTimeout(() => {
          fetchMappings();
          refreshData();
        }, 2000);
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [mappingId]: false }));
    }
  };

  const refreshAll = () => {
    fetchMappings();
    refreshData();
  };

  if (hasError) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-medium">Unable to load synchronization dashboard</h3>
              <p className="text-muted-foreground">
                {errorMessage || 'There was an error connecting to the database. Please ensure the database tables have been created.'}
              </p>
              <Button onClick={refreshAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Active Mappings</h3>

          {isLoadingMappings ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-6" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          ) : mappings.length === 0 ? (
            <Card className="p-6 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No active mappings found.</p>
              <p className="mt-2">
                Create a connection and set up table mappings to start synchronizing data.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {mappings
                .filter(status => status.enabled)
                .map((status) => (
                  <div key={status.mapping_id} className="col-span-1">
                    <ActiveMappingCard 
                      status={status} 
                      onSync={handleSync} 
                      isSyncing={isSyncing[status.mapping_id] || false} 
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Sync Statistics</h3>
          <SyncMetricsCard 
            syncStats={syncStats} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <SyncLogsList limit={5} />
      </div>
    </div>
  );
}

export default SyncDashboard;
