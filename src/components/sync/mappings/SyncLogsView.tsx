import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

type SyncLogStatus = 'started' | 'completed' | 'failed';

interface SyncLogDetails {
  message?: string;
  syncedFields?: string[];
  errorDetails?: any;
  recordDetails?: {
    table: string;
    inserted?: number;
    updated?: number;
    failed?: number;
    sampleData?: any;
  };
  syncDuration?: number;
}

interface SyncLog {
  id: string;
  mapping_id: string;
  status: SyncLogStatus;
  message: string;
  records_processed: number;
  started_at: string;
  completed_at: string | null;
  details?: string; // JSON string containing detailed information
}

interface SyncLogsViewProps {
  mappingId: string;
}

export const SyncLogsView: React.FC<SyncLogsViewProps> = ({ mappingId }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const typedLogs = (data || []).map(log => ({
        ...log,
        status: log.status as SyncLogStatus
      }));
      
      setLogs(typedLogs);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load sync logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [mappingId]);

  const getStatusIcon = (status: SyncLogStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const parseLogDetails = (log: SyncLog): SyncLogDetails | null => {
    if (!log.details) return null;
    
    try {
      return JSON.parse(log.details) as SyncLogDetails;
    } catch (err) {
      console.error('Error parsing log details:', err);
      return null;
    }
  };

  const renderSyncedFields = (details: SyncLogDetails | null) => {
    if (!details?.syncedFields || details.syncedFields.length === 0) {
      return <div className="text-xs text-muted-foreground">No field details available</div>;
    }

    return (
      <div className="mt-2">
        <h4 className="text-xs font-medium mb-1">Synced Fields:</h4>
        <div className="flex flex-wrap gap-1">
          {details.syncedFields.map((field, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {field}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderRecordDetails = (details: SyncLogDetails | null) => {
    if (!details?.recordDetails) {
      return null;
    }

    const { table, inserted, updated, failed } = details.recordDetails;
    
    return (
      <div className="mt-3">
        <h4 className="text-xs font-medium mb-1">Record Details:</h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-muted/50 p-1 rounded">
            <div className="font-medium">Table</div>
            <div>{table}</div>
          </div>
          <div className="bg-muted/50 p-1 rounded">
            <div className="font-medium">Inserted</div>
            <div className="text-green-600">{inserted || 0}</div>
          </div>
          <div className="bg-muted/50 p-1 rounded">
            <div className="font-medium">Updated</div>
            <div className="text-blue-600">{updated || 0}</div>
          </div>
          <div className="bg-muted/50 p-1 rounded">
            <div className="font-medium">Failed</div>
            <div className="text-red-600">{failed || 0}</div>
          </div>
        </div>
        
        {details.recordDetails.sampleData && (
          <div className="mt-2">
            <h4 className="text-xs font-medium mb-1">Sample Data:</h4>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(details.recordDetails.sampleData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderErrorDetails = (details: SyncLogDetails | null) => {
    if (!details?.errorDetails) {
      return null;
    }

    return (
      <div className="mt-3">
        <h4 className="text-xs font-medium mb-1 text-destructive">Error Details:</h4>
        <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-32 text-destructive">
          {JSON.stringify(details.errorDetails, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sync History</h3>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No sync logs found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const details = parseLogDetails(log);
            const isExpanded = expandedLogs[log.id] || false;
            
            return (
              <Collapsible 
                key={log.id} 
                open={isExpanded}
                onOpenChange={() => toggleLogExpansion(log.id)}
                className="border rounded-md overflow-hidden"
              >
                <div className="bg-card">
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <div>
                            <div className="font-medium">
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                              {log.status === 'completed' && ` (${log.records_processed} records)`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.started_at), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-right">
                            {log.message && <div>{log.message}</div>}
                            {log.completed_at && (
                              <div className="text-xs text-muted-foreground">
                                Duration: {((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1)}s
                              </div>
                            )}
                          </div>
                          {details && (
                            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  {details && (
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4 px-4 border-t">
                        {renderSyncedFields(details)}
                        {renderRecordDetails(details)}
                        {renderErrorDetails(details)}
                        
                        {!details.syncedFields && !details.recordDetails && !details.errorDetails && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Info className="h-4 w-4" />
                            <span>No detailed information available for this sync operation.</span>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};
