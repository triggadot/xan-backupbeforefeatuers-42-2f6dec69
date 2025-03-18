
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SyncStats } from './SyncStats';
import { RecentActivity } from './RecentActivity';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { formatDateTime } from '@/utils/date-utils';

interface MappingStatus {
  mapping_id: string;
  connection_id: string;
  app_name: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  enabled: boolean;
  sync_direction: string;
  current_status: string;
  records_processed: number;
  total_records: number;
  last_sync_completed_at: string | null;
  error_count: number;
}

const SyncOverview: React.FC = () => {
  const navigate = useNavigate();
  const [activeMappings, setActiveMappings] = useState<MappingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchMappings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .eq('enabled', true)
          .order('last_sync_started_at', { ascending: false });
        
        if (error) throw error;
        setActiveMappings(data || []);
      } catch (error) {
        console.error('Error fetching mappings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMappings();
    
    // Set up realtime subscription for mapping status changes
    const mappingsChannel = supabase
      .channel('gl_mapping_status_changes')
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
  }, [refreshTrigger]);

  const handleSync = async (mappingId: string, connectionId: string) => {
    setIsSyncing(prev => ({ ...prev, [mappingId]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          mappingId,
          connectionId
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Wait a bit and refresh the list to show updated status
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 2000);
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(prev => ({ ...prev, [mappingId]: false }));
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderSyncProgress = (mapping: MappingStatus) => {
    const progress = mapping.total_records 
      ? Math.min(Math.round((mapping.records_processed / mapping.total_records) * 100), 100) 
      : 0;
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="h-5 w-5 text-gray-400" />;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'started':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {activeMappings.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <p className="text-muted-foreground">No active mappings found</p>
                <p className="mt-2">Create connections and mappings to start syncing data</p>
                <div className="mt-4">
                  <Button onClick={() => navigate('/sync/connections')}>
                    Set Up Connection
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeMappings.map(mapping => (
                <Card key={mapping.mapping_id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{mapping.app_name || 'Unnamed App'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {mapping.glide_table_display_name} {mapping.sync_direction === 'both' ? '↔' : mapping.sync_direction === 'to_supabase' ? '→' : '←'} {mapping.supabase_table}
                      </p>
                    </div>
                    <SyncStatusBadge status={mapping.current_status} />
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    {getStatusIcon(mapping.current_status)}
                    <span className="ml-2">
                      {mapping.records_processed ? `${mapping.records_processed} records processed` : 'No data processed yet'}
                    </span>
                    
                    {mapping.error_count > 0 && (
                      <span className="ml-auto bg-red-50 text-red-600 px-2 py-1 rounded text-xs">
                        {mapping.error_count} {mapping.error_count === 1 ? 'error' : 'errors'}
                      </span>
                    )}
                  </div>
                  
                  {renderSyncProgress(mapping)}
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Last sync: {mapping.last_sync_completed_at ? formatDateTime(mapping.last_sync_completed_at) : 'Never'}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/sync/mappings/${mapping.mapping_id}`)}
                      >
                        Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleSync(mapping.mapping_id, mapping.connection_id)}
                        disabled={isSyncing[mapping.mapping_id] || mapping.current_status === 'processing'}
                      >
                        {isSyncing[mapping.mapping_id] ? (
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
          <SyncStats />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <RecentActivity />
      </div>
    </div>
  );
};

export default SyncOverview;
