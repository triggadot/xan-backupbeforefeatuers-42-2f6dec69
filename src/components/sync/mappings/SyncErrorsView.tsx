
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const { toast } = useToast();

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
            <Card key={error.id} className="border-red-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-red-600">{error.error_type}</div>
                    <div className="text-sm mt-1">{error.error_message}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {format(new Date(error.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                    {error.record_data && (
                      <div className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-32">
                        <pre>{JSON.stringify(error.record_data, null, 2)}</pre>
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      {error.retryable && (
                        <Button variant="outline" size="sm" className="mr-2">
                          Retry
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
