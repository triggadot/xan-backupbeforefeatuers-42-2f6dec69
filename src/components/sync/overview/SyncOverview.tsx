
import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncMetricsCard } from './SyncMetricsCard';
import { RecentSyncsCard } from './RecentSyncsCard';

export default function SyncOverview() {
  const navigate = useNavigate();
  const { syncStatus, recentLogs, syncStats, isLoading, refreshData } = useGlSyncStatus();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const navigateToConnections = () => {
    navigate('/sync/connections');
  };

  const navigateToMappings = () => {
    navigate('/sync/mappings');
  };

  const countByStatus = {
    enabled: syncStatus?.filter(s => s.enabled).length || 0,
    total: syncStatus?.length || 0,
  };

  const countByDirection = {
    toSupabase: syncStatus?.filter(s => s.sync_direction === 'to_supabase').length || 0,
    toGlide: syncStatus?.filter(s => s.sync_direction === 'to_glide').length || 0,
    both: syncStatus?.filter(s => s.sync_direction === 'both').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Sync Dashboard</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {countByStatus.total}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-muted-foreground" onClick={navigateToMappings}>
              View all mappings
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {countByStatus.enabled}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {countByStatus.total}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-muted-foreground" onClick={navigateToMappings}>
              Manage active mappings
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sync Directions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="flex flex-col text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span>To Supabase</span>
                  <span className="font-medium">{countByDirection.toSupabase}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span>To Glide</span>
                  <span className="font-medium">{countByDirection.toGlide}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bidirectional</span>
                  <span className="font-medium">{countByDirection.both}</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter></CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {[...new Set(syncStatus?.map(s => s.connection_id) || [])].length}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-muted-foreground" onClick={navigateToConnections}>
              Manage connections
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SyncMetricsCard syncStats={syncStats} isLoading={isLoading} />
        </div>
        <div>
          <RecentSyncsCard recentLogs={recentLogs} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
