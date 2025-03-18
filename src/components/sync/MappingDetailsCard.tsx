
import React, { useState } from 'react';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useGlSync } from '@/hooks/useGlSync';
import { useQuery } from '@tanstack/react-query';
import { GlMapping } from '@/types/glsync';
import { formatTimestamp, calculateDuration } from '@/utils/glsync-transformers';
import { supabase } from '@/integrations/supabase/client';

interface MappingDetailsCardProps {
  mapping: GlMapping;
  connectionName?: string;
  onSyncComplete?: () => void;
}

const MappingDetailsCard: React.FC<MappingDetailsCardProps> = ({ 
  mapping, 
  connectionName,
  onSyncComplete
}) => {
  const { syncData } = useGlSync();
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch the mapping status to get latest sync information
  const { 
    data: mappingStatus, 
    isLoading, 
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['mapping-status', mapping.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .eq('mapping_id', mapping.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Single result expected but got none
          throw error;
        }
        return null;
      }
      
      return data;
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching mapping status:', error);
        toast({
          title: 'Error fetching mapping status',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });

  // Fetch recent sync logs for this mapping
  const {
    data: recentSyncLog, 
    isLoading: isLogLoading,
    refetch: refetchLog
  } = useQuery({
    queryKey: ['recent-sync-log', mapping.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', mapping.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Single result expected but got none
          throw error;
        }
        return null;
      }
      
      return data;
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching recent sync log:', error);
        // Don't show toast for this minor error
      }
    }
  });

  // Validate the mapping
  const { data: validationResult, isLoading: isValidating } = useQuery({
    queryKey: ['validate-mapping', mapping.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('gl_validate_column_mapping', { p_mapping_id: mapping.id });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : { is_valid: false, validation_message: 'Unknown validation error' };
    },
    meta: {
      onError: (error: any) => {
        console.error('Error validating mapping:', error);
        toast({
          title: 'Error validating mapping',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });

  const handleSync = async () => {
    if (!mapping.connection_id) {
      toast({
        title: 'Sync failed',
        description: 'Missing connection ID',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const result = await syncData(mapping.connection_id, mapping.id);
      
      if (result.success) {
        toast({
          title: 'Sync initiated',
          description: 'The synchronization process has been started.',
        });
        
        // Refresh data after a short delay
        setTimeout(() => {
          refetchStatus();
          refetchLog();
          if (onSyncComplete) onSyncComplete();
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
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Not Synced</Badge>;
    
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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'started':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading || isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{connectionName || 'Glide Connection'}: {mapping.glide_table_display_name}</CardTitle>
            <CardDescription>
              Syncing data from {mapping.glide_table} to {mapping.supabase_table}
            </CardDescription>
          </div>
          {mappingStatus && getStatusBadge(mappingStatus.current_status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {validationResult && !validationResult.is_valid ? (
            <div className="p-4 bg-red-50 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium text-red-700">Mapping Validation Failed</p>
                  <p className="text-sm text-red-600">{validationResult.validation_message}</p>
                </div>
              </div>
            </div>
          ) : validationResult && validationResult.validation_message.includes('Warning') ? (
            <div className="p-4 bg-amber-50 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium text-amber-700">Mapping Validation Warning</p>
                  <p className="text-sm text-amber-600">{validationResult.validation_message}</p>
                </div>
              </div>
            </div>
          ) : null}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sync Direction</p>
              <p>{mapping.sync_direction === 'to_supabase' ? 'Glide to Supabase' : 
                 mapping.sync_direction === 'to_glide' ? 'Supabase to Glide' : 'Bidirectional'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center">
                {getStatusIcon(mappingStatus?.current_status)}
                <span className="ml-2">
                  {mappingStatus?.current_status ? 
                   mappingStatus.current_status.charAt(0).toUpperCase() + 
                   mappingStatus.current_status.slice(1) : 
                   'Not synced yet'}
                </span>
              </div>
            </div>
          </div>

          {mappingStatus && typeof mappingStatus.records_processed === 'number' && mappingStatus.total_records && (
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Progress: {mappingStatus.records_processed} of {mappingStatus.total_records} records 
                  ({Math.round((mappingStatus.records_processed / mappingStatus.total_records) * 100)}%)
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(Math.round((mappingStatus.records_processed / mappingStatus.total_records) * 100), 100)}%` 
                  }}>
                </div>
              </div>
            </div>
          )}

          {recentSyncLog && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Sync Started</p>
                <p>{formatTimestamp(recentSyncLog.started_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p>{calculateDuration(recentSyncLog.started_at, recentSyncLog.completed_at)}</p>
              </div>
            </div>
          )}

          {mappingStatus?.error_count > 0 && (
            <div className="p-3 bg-red-50 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-red-700">
                  {mappingStatus.error_count} {mappingStatus.error_count === 1 ? 'error' : 'errors'} detected
                </span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Check the Sync Errors tab for details.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleSync}
              disabled={isSyncing || (mappingStatus?.current_status === 'processing')}
            >
              {isSyncing || mappingStatus?.current_status === 'processing' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MappingDetailsCard;
