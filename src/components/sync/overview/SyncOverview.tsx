import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useGlSync } from '@/hooks/useGlSync';
import { useIsMobile } from '@/hooks/use-mobile';
import { debounce } from 'lodash';
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle2, XCircle, Loader2, Database, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function SyncOverview() {
  const { allSyncStatuses, isLoading, refreshData } = useGlSyncStatus();
  const { syncData } = useGlSync();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const isMobile = useIsMobile();
  const [syncingItems, setSyncingItems] = useState<Record<string, boolean>>({});

  const { totalMappings, enabledMappings, disabledMappings, activeMappings, hasErrors } = useMemo(() => ({
    totalMappings: allSyncStatuses?.length || 0,
    enabledMappings: allSyncStatuses?.filter(status => status.enabled).length || 0,
    disabledMappings: allSyncStatuses?.filter(status => !status.enabled).length || 0,
    activeMappings: allSyncStatuses?.filter(status => status.current_status === 'processing').length || 0,
    hasErrors: allSyncStatuses?.filter(status => status.error_count && status.error_count > 0).length || 0,
  }), [allSyncStatuses]);

  const debouncedNavigate = useMemo(
    () => debounce((path: string) => navigate(path), 300),
    [navigate]
  );

  const handleSync = async (connectionId: string, mappingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const result = await syncData(connectionId, mappingId);
      
      if (result) {
        toast({
          title: 'Sync started',
          description: 'The synchronization process has been initiated.',
        });
        
        // Refresh data after a short delay to allow sync to start
        setTimeout(() => {
          refreshData();
        }, 2000);
      } else {
        toast({
          title: 'Sync failed',
          description: 'An unknown error occurred',
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
      setSyncingItems(prev => ({ ...prev, [mappingId]: false }));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!allSyncStatuses || allSyncStatuses.length === 0) {
      return (
        <Card className="w-full">
          <CardContent className="p-4 text-center">
            <Database className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">No Sync Mappings Found</h3>
            <p className="text-muted-foreground mt-1">
              Create a connection and set up table mappings to start synchronizing data.
            </p>
          </CardContent>
        </Card>
      );
    }

    const filteredStats = activeTab === 'all' 
      ? allSyncStatuses 
      : allSyncStatuses.filter(stat => stat.current_status === activeTab);

    return (
      <div className="space-y-4">
        {filteredStats.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-4 text-center">
              <Info className="h-10 w-10 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">No {activeTab} Mappings</h3>
              <p className="text-muted-foreground mt-1">
                There are no mappings with status "{activeTab}".
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStats.map((status) => (
              <div 
                key={status.mapping_id} 
                className="p-4 border rounded-lg hover:bg-accent/20 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="cursor-pointer" onClick={() => debouncedNavigate(`/sync/mappings/${status.mapping_id}`)}>
                    <h4 className="font-medium truncate max-w-[200px] sm:max-w-none">
                      {status.glide_table_display_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {status.app_name} → {status.supabase_table}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SyncStatusBadge status={status.current_status || 'idle'} />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          debouncedNavigate(`/sync/mappings/${status.mapping_id}`);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Details
                      </Button>
                      <Button 
                        size="sm"
                        variant="default"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => handleSync(status.connection_id, status.mapping_id, e)}
                        disabled={syncingItems[status.mapping_id] || status.current_status === 'processing'}
                      >
                        {syncingItems[status.mapping_id] || status.current_status === 'processing' ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Sync Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            All Mappings
          </Button>
          <Button
            variant={activeTab === 'enabled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('enabled')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Enabled
          </Button>
          <Button
            variant={activeTab === 'disabled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('disabled')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Disabled
          </Button>
          <Button
            variant={activeTab === 'errors' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('errors')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            With Errors
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isLoading}
          className="text-xs sm:text-sm h-8 sm:h-9"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col p-4 border rounded-md bg-background shadow-sm">
          <span className="text-sm text-muted-foreground">Total Mappings</span>
          <span className="text-2xl font-semibold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalMappings}</span>
        </div>

        <div className="flex flex-col p-4 border rounded-md bg-background shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Enabled</span>
          </div>
          <span className="text-2xl font-semibold">{isLoading ? <Skeleton className="h-8 w-16" /> : enabledMappings}</span>
        </div>

        <div className="flex flex-col p-4 border rounded-md bg-background shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-muted-foreground">Disabled</span>
          </div>
          <span className="text-2xl font-semibold">{isLoading ? <Skeleton className="h-8 w-16" /> : disabledMappings}</span>
        </div>

        <div className="flex flex-col p-4 border rounded-md bg-background shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">With Errors</span>
          </div>
          <span className="text-2xl font-semibold">{isLoading ? <Skeleton className="h-8 w-16" /> : hasErrors}</span>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
