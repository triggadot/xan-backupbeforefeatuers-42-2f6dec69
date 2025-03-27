
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SyncMetricsCard from './overview/SyncMetricsCard';
import { RecentActivity } from './overview/RecentActivity';
import { ActiveMappingCard } from './overview/ActiveMappingCard';
import SyncOverview from './overview/SyncOverview';
import { SyncStats } from './overview/SyncStats';
import { RelationshipMapper } from './RelationshipMapper';
import { RecentSyncList } from './overview/RecentSyncList';
import { useGlSync } from '@/hooks/useGlSync';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';

export default function SyncDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { mapAllRelationships, isLoading } = useGlSync();
  const { toast } = useToast();
  const [isMappingAll, setIsMappingAll] = useState(false);
  const { syncStats, isLoading: statsLoading } = useGlSyncStatus();

  const handleMapAllRelationships = async () => {
    setIsMappingAll(true);
    try {
      const success = await mapAllRelationships();
      if (success) {
        toast({
          title: "Success",
          description: "Successfully mapped all relationships across tables",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsMappingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sync Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleMapAllRelationships} 
            disabled={isMappingAll || isLoading}
          >
            {isMappingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Map All Relationships
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="mappings">Active Mappings</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SyncOverview />
            <SyncStats />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <RecentActivity />
            </div>
            <div>
              <SyncMetricsCard syncStats={syncStats || []} isLoading={statsLoading} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="connections">
          <h3 className="text-lg font-semibold mb-4">Recent Syncs</h3>
          <RecentSyncList />
        </TabsContent>
        
        <TabsContent value="mappings">
          <h3 className="text-lg font-semibold mb-4">Active Mappings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActiveMappingCard 
              status={{
                mapping_id: '0',
                connection_id: '0',
                app_name: 'Loading...',
                glide_table: 'Loading...',
                glide_table_display_name: 'No active mappings',
                supabase_table: 'Loading...',
                sync_direction: 'to_supabase',
                enabled: true,
                current_status: 'idle',
                last_sync_started_at: null,
                last_sync_completed_at: null,
                records_processed: 0,
                error_count: 0,
                total_records: 0
              }}
              onSync={(connectionId, mappingId) => Promise.resolve()}
              isSyncing={false}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="relationships">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RelationshipMapper />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
