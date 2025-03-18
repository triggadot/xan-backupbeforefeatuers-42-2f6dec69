
import { useState } from 'react';
import { ArrowRight, RefreshCw, Check, AlertTriangle, Clock, Database, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import SyncMetricsCard from './SyncMetricsCard';
import { formatTimestamp } from '@/utils/glsync-transformers';

const SyncDashboard = () => {
  const { syncStatus, recentLogs, syncStats, isLoading, hasError, errorMessage, refreshData } = useGlSyncStatus();
  const { syncData } = useGlSync();
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500">Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="h-5 w-5 text-gray-400" />;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'started':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
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
              <Button onClick={refreshData}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Active Mappings</h2>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
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
          ) : syncStatus.length === 0 ? (
            <Card className="p-6 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No active mappings found.</p>
              <p className="mt-2">
                Create a connection and set up table mappings to start synchronizing data.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {syncStatus
                .filter(status => status.enabled)
                .map((status) => (
                  <Card key={status.mapping_id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium">{status.app_name || 'Unnamed App'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {status.glide_table_display_name} {status.sync_direction === 'both' ? '↔' : status.sync_direction === 'to_supabase' ? '→' : '←'} {status.supabase_table}
                        </p>
                      </div>
                      {getStatusBadge(status.current_status)}
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        {getStatusIcon(status.current_status)}
                        <span className="ml-2">
                          {status.records_processed ? `${status.records_processed} records processed` : 'No data processed yet'}
                        </span>
                      </div>

                      {status.error_count > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-600">
                          {status.error_count} {status.error_count === 1 ? 'error' : 'errors'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-1 mb-3 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${status.total_records && status.records_processed 
                            ? Math.min(Math.round((status.records_processed / status.total_records) * 100), 100) 
                            : 0}%` 
                        }}>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Last sync: {formatTimestamp(status.last_sync_completed_at)}
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/sync/products/${status.mapping_id}`}>
                          <Button 
                            size="sm"
                            variant="outline"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </Link>
                        <Button 
                          size="sm"
                          onClick={() => handleSync(status.connection_id, status.mapping_id)}
                          disabled={isSyncing[status.mapping_id] || status.current_status === 'processing'}
                        >
                          {isSyncing[status.mapping_id] ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Sync Now
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
          <SyncMetricsCard 
            syncStats={syncStats} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        
        {isLoading ? (
          <Card>
            <div className="p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center py-3 border-b last:border-b-0">
                  <Skeleton className="h-8 w-8 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : recentLogs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No recent activity found.</p>
          </Card>
        ) : (
          <Card>
            <div className="p-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start py-3 border-b last:border-b-0">
                  <div className="mr-4 mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {log.app_name || 'Unnamed App'}: {log.glide_table_display_name || log.glide_table || 'Unknown'} → {log.supabase_table || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.message || `Status: ${log.status}`}
                          {log.records_processed ? ` (${log.records_processed} records)` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatTimestamp(log.started_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SyncDashboard;
