import { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, Check, AlertTriangle, Clock, Database, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlSyncStatus, GlRecentLog } from '@/types/glsync';
import { Link } from 'react-router-dom';

const SyncDashboard = () => {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [statusData, logsData] = await Promise.all([
        glSyncApi.getSyncStatus().catch(error => {
          console.error('Error fetching sync status:', error);
          return [];
        }),
        glSyncApi.getRecentLogs(5).catch(error => {
          console.error('Error fetching recent logs:', error);
          return [];
        })
      ]);
      
      setSyncStatus(statusData);
      setRecentLogs(logsData);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setHasError(true);
      toast({
        title: 'Error fetching sync data',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSync = async (connectionId: string, mappingId: string) => {
    setIsSyncing(prev => ({ ...prev, [mappingId]: true }));
    
    try {
      const result = await glSyncApi.syncData(connectionId, mappingId);
      
      if (result.success) {
        toast({
          title: 'Sync started',
          description: 'The synchronization process has been initiated.',
        });
        
        setTimeout(() => {
          fetchData();
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
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
      <Card className="p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-medium">Unable to load synchronization dashboard</h3>
          <p className="text-muted-foreground">
            There was an error connecting to the database. Please ensure the database tables have been created.
          </p>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Active Mappings</h2>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syncStatus
              .filter(status => status.enabled)
              .map((status) => (
                <Card key={status.mapping_id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{status.app_name || 'Unnamed App'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {status.glide_table} {status.sync_direction === 'both' ? '↔' : status.sync_direction === 'to_supabase' ? '→' : '←'} {status.supabase_table}
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
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Last sync: {formatDate(status.last_sync_completed_at)}
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
                        disabled={isSyncing[status.mapping_id]}
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
                          {log.app_name || 'Unnamed App'}: {log.glide_table || 'Unknown'} → {log.supabase_table || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.message || `Status: ${log.status}`}
                          {log.records_processed ? ` (${log.records_processed} records)` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatDate(log.started_at)}
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
