
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncLog } from '@/types/glsync';
import { SyncLogsTable } from '../SyncLogsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SyncLogsViewProps {
  mappingId: string;
}

export function SyncLogsView({ mappingId }: SyncLogsViewProps) {
  const [logs, setLogs] = useState<GlSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (mappingId) {
      fetchLogs();
    }
  }, [mappingId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Ensure the logs match the GlSyncLog type expected by SyncLogsTable
      const typedLogs = (data || []).map(log => ({
        ...log,
        status: log.status as "started" | "processing" | "completed" | "failed"
      })) as GlSyncLog[];
      
      setLogs(typedLogs);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Sync Logs</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <SyncLogsTable logs={logs} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
