import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { SyncStats } from './SyncStats';
import { RecentSyncsCard } from './RecentSyncsCard';
import { SyncMetricsCard } from './SyncMetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const SyncOverview: React.FC = () => {
  const { allStatuses, isLoading, error } = useGlSyncStatus();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  // Calculate stats
  const totalMappings = allStatuses.length;
  const activeMappings = allStatuses.filter(s => s.enabled).length;
  const errorMappings = allStatuses.filter(s => s.current_status === 'error').length;
  const successMappings = allStatuses.filter(s => 
    s.current_status === 'success' || s.current_status === 'completed'
  ).length;

  // Get the most recent sync time
  const mostRecentSync = allStatuses.reduce((latest, current) => {
    if (!latest.last_sync_completed_at) return current;
    if (!current.last_sync_completed_at) return latest;
    
    return new Date(current.last_sync_completed_at) > new Date(latest.last_sync_completed_at)
      ? current
      : latest;
  }, allStatuses[0]);

  // Calculate total records synced
  const totalRecordsSynced = allStatuses.reduce((sum, status) => 
    sum + (status.records_processed || 0), 0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <SyncStats 
          totalMappings={totalMappings}
          activeMappings={activeMappings}
          errorMappings={errorMappings}
          successMappings={successMappings}
          isLoading={isLoading}
        />
        
        <RecentSyncsCard />
      </div>
      
      <div className="space-y-6">
        <SyncMetricsCard stats={{
          total_records_processed: totalRecordsSynced,
          successful_syncs: successMappings,
          failed_syncs: errorMappings,
          syncs: totalMappings,
          sync_date: mostRecentSync?.last_sync_completed_at || null
        }} />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Connections</span>
                  <span className="font-medium">{
                    [...new Set(allStatuses.map(s => s.connection_id).filter(Boolean))].length
                  }</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="font-medium">{
                    mostRecentSync?.last_sync_completed_at 
                      ? new Date(mostRecentSync.last_sync_completed_at).toLocaleString()
                      : 'Never'
                  }</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
