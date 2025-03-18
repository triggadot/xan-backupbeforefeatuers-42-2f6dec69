
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatRelativeTime } from '@/utils/date-utils';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';

interface RecentLog {
  id: string;
  app_name: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  status: string;
  message: string;
  records_processed: number;
  started_at: string;
  sync_direction: string;
}

export const RecentActivity: React.FC = () => {
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gl_recent_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching recent logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    
    // Set up realtime subscription for log updates
    const logsChannel = supabase
      .channel('gl_recent_logs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_recent_logs' }, 
        () => {
          fetchLogs();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(logsChannel);
    };
  }, []);

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
      <Card>
        <CardContent className="p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center py-3 border-b last:border-b-0">
              <Skeleton className="h-8 w-8 rounded-full mr-4" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No recent activity found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {logs.map((log) => (
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
                <div className="flex flex-col items-end">
                  <SyncStatusBadge status={log.status} />
                  <p className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                    {formatRelativeTime(log.started_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
