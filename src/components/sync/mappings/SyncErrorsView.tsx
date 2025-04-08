import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Code, Database, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGlSync } from '@/hooks/useGlSync';

interface SyncError {
  id: string;
  mapping_id: string;
  error_type: string;
  error_message: string;
  record_data: any;
  created_at: string;
  resolved_at: string | null;
  retryable: boolean;
  resolution_notes: string | null;
}

interface SyncErrorsViewProps {
  mappingId: string;
}

export const SyncErrorsView: React.FC<SyncErrorsViewProps> = ({ mappingId }) => {
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();
  const { retryFailedSync } = useGlSync();

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_sync_errors')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('created_at', { ascending: false })
        .is('resolved_at', null)
        .limit(50);

      if (error) throw error;
      setErrors(data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load sync errors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [mappingId]);

  const resolveError = async (errorId: string) => {
    try {
      const { error } = await supabase
        .from('gl_sync_errors')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', errorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Error marked as resolved',
      });

      fetchErrors();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to resolve error',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = async (errorId: string) => {
    setRetrying(errorId);
    try {
      // Get the error record to find the mapping ID
      const { data: errorData, error: fetchError } = await supabase
        .from('gl_sync_errors')
        .select('mapping_id')
        .eq('id', errorId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Retry the sync for this mapping
      const success = await retryFailedSync(errorId);
      
      if (success) {
        toast({
          title: 'Retry Successful',
          description: 'The sync operation has been retried successfully.',
        });
        
        // Mark the error as resolved
        await resolveError(errorId);
      } else {
        throw new Error('Retry failed');
      }
    } catch (err) {
      toast({
        title: 'Retry Failed',
        description: err instanceof Error ? err.message : 'Failed to retry sync operation',
        variant: 'destructive',
      });
    } finally {
      setRetrying(null);
    }
  };

  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case 'DATABASE_ERROR':
        return <Database className="h-5 w-5 text-red-500" />;
      case 'TRANSFORM_ERROR':
        return <ArrowRightLeft className="h-5 w-5 text-orange-500" />;
      case 'API_ERROR':
        return <Code className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getErrorTypeBadge = (errorType: string) => {
    let color = '';
    switch (errorType) {
      case 'DATABASE_ERROR':
        color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        break;
      case 'TRANSFORM_ERROR':
        color = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        break;
      case 'API_ERROR':
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
    
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
        {errorType}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sync Errors</h3>
        <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {errors.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No unresolved sync errors found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {errors.map(error => (
            <Card key={error.id} className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getErrorTypeIcon(error.error_type)}
                    <CardTitle className="text-base">{getErrorTypeBadge(error.error_type)}</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(error.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-sm font-medium mb-2">{error.error_message}</div>
                
                {error.record_data && (
                  <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs mb-2">
                        <Code className="h-3 w-3 mr-2" />
                        View Details
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-64 mb-3">
                        <Tabs defaultValue="formatted">
                          <TabsList className="mb-2">
                            <TabsTrigger value="formatted">Formatted</TabsTrigger>
                            <TabsTrigger value="raw">Raw</TabsTrigger>
                          </TabsList>
                          <TabsContent value="formatted">
                            <div className="space-y-2">
                              {error.error_type === 'TRANSFORM_ERROR' && error.record_data.glide_row_id && (
                                <div>
                                  <Badge variant="outline" className="mb-1">Glide Row ID</Badge>
                                  <div className="font-mono">{error.record_data.glide_row_id}</div>
                                </div>
                              )}
                              {error.error_type === 'DATABASE_ERROR' && error.record_data.batch_index && (
                                <div>
                                  <Badge variant="outline" className="mb-1">Batch Information</Badge>
                                  <div>Batch: {error.record_data.batch_index}</div>
                                  <div>Size: {error.record_data.batch_size || 'Unknown'}</div>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="raw">
                            <pre>{JSON.stringify(error.record_data, null, 2)}</pre>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                
                <div className="mt-3 flex justify-end gap-2">
                  {error.retryable && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRetry(error.id)}
                      disabled={retrying === error.id}
                    >
                      {retrying === error.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Retry
                        </>
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resolveError(error.id)}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
