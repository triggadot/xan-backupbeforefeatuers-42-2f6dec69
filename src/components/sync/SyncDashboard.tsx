
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGlSync } from '@/hooks/useGlSync';
import { Plus, RefreshCw, Settings, PanelTop, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStats, GlRecentLog } from '@/types/glsync';
import { RecentSyncList } from './overview/RecentSyncList';
import { RelationshipMapper } from './RelationshipMapper';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Helper function to format date for chart
const formatDateForChart = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const SyncDashboard = () => {
  const [syncStats, setSyncStats] = useState<GlSyncStats[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { mapAllRelationships, isLoading: isMappingRelationships } = useGlSync();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates for sync logs
    const channel = supabase
      .channel('sync-logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gl_sync_logs' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setIsLoadingStats(true);
    try {
      // Fetch sync stats
      const { data: statsData, error: statsError } = await supabase
        .from('gl_sync_stats')
        .select('*')
        .order('sync_date', { ascending: false })
        .limit(14);

      if (statsError) throw statsError;
      setSyncStats(statsData as GlSyncStats[]);

      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('gl_recent_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setRecentLogs(logsData as GlRecentLog[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Sync Dashboard</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoadingStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/sync/mappings/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Mapping
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">
            <PanelTop className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="database" className="flex-1">
            <Layers className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sync Activity Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sync Activity</CardTitle>
                <CardDescription>
                  Records processed over the last 14 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[...syncStats].reverse().map(stat => ({
                        date: formatDateForChart(stat.sync_date),
                        records: stat.total_records_processed,
                        syncs: stat.syncs
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="records"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorRecords)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common sync operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/sync/connections')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Connections
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/sync/mappings')}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Configure Mappings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/sync/logs')}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  View Sync Logs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Syncs */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Syncs</CardTitle>
              <CardDescription>Latest synchronization operations</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentSyncList logs={recentLogs} isLoading={isLoadingStats} />
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/sync/logs')}
              >
                View All Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RelationshipMapper />
            
            {/* Additional tools could be added here */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Health Check</CardTitle>
                <CardDescription>
                  Validate your sync configuration and data integrity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The health check tool verifies your mappings, table structures, and data integrity.
                  Use this tool to identify potential issues with your sync configuration.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Information</CardTitle>
                <CardDescription>
                  View database tables and their relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The database structure for Glide sync includes:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>gl_connections</strong> - Stores Glide API connection credentials</li>
                  <li><strong>gl_mappings</strong> - Defines mapping between Glide and Supabase tables</li>
                  <li><strong>gl_sync_logs</strong> - Records sync operations and their results</li>
                  <li><strong>gl_sync_errors</strong> - Stores detailed error information</li>
                  <li><strong>gl_*</strong> - Domain-specific tables (products, accounts, etc.)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Relationships between tables use both rowid_* columns (Glide row IDs) and sb_* columns (Supabase UUIDs).
                </p>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/docs/SYNC_ARCHITECTURE.md', '_blank')}
                >
                  View Architecture Docs
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncDashboard;
