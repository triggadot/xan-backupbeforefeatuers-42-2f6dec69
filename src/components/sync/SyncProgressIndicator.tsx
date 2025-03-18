
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping, GlSyncStatus } from '@/types/glsync';

export interface SyncProgressIndicatorProps {
  mappingId?: string;
  mapping?: GlMapping;
}

export function SyncProgressIndicator({ mappingId, mapping }: SyncProgressIndicatorProps) {
  const [status, setStatus] = useState<GlSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the mappingId from props or from the mapping object
  const effectiveMappingId = mappingId || (mapping?.id);

  useEffect(() => {
    if (!effectiveMappingId) return;

    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .eq('mapping_id', effectiveMappingId)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
            console.error('Error fetching sync status:', error);
          }
          setStatus(null);
        } else {
          setStatus(data as unknown as GlSyncStatus);
        }
      } catch (err) {
        console.error('Error in sync status fetch:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Set up realtime subscription for status updates
    const statusChannel = supabase
      .channel(`mapping-status-${effectiveMappingId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gl_mapping_status',
          filter: `mapping_id=eq.${effectiveMappingId}`
        }, 
        (payload) => {
          setStatus(payload.new as unknown as GlSyncStatus);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [effectiveMappingId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading Sync Status
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            No Status Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This mapping hasn't been synchronized yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isActive = ['started', 'processing'].includes(status.current_status || '');
  const isFailed = status.current_status === 'failed';
  const processedRecords = status.records_processed || 0;
  const totalRecords = status.total_records || 0;
  const progressPercentage = totalRecords > 0 
    ? Math.min(100, Math.round((processedRecords / totalRecords) * 100)) 
    : 0;

  // Format sync time
  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          {isActive ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
          ) : isFailed ? (
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          )}
          Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Status</span>
              <span className={
                isFailed ? 'text-red-500' : 
                isActive ? 'text-blue-500' : 
                'text-green-500'
              }>
                {status.current_status 
                  ? status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1) 
                  : 'Unknown'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Last Sync</span>
              <span>{formatTimestamp(status.last_sync_started_at)}</span>
            </div>
            
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Records</span>
              <span>{processedRecords} / {totalRecords}</span>
            </div>
            
            {isActive && (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </>
            )}
            
            {isFailed && status.error_count && status.error_count > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="font-medium text-red-500">Errors</span>
                <span className="text-red-500">{status.error_count}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
