
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyncError {
  id: string;
  mapping_id: string;
  error_type: string;
  error_message: string;
  record_data?: any;
  created_at: string;
  resolved_at: string | null;
  retryable: boolean;
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
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

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
      const { error } = await supabase.rpc('gl_resolve_sync_error', {
        p_error_id: errorId,
        p_resolution_notes: 'Manually resolved via dashboard'
      });

      if (error) throw error;
      
      setErrors(prev => prev.filter(e => e.id !== errorId));
      
      toast({
        title: 'Success',
        description: 'Error marked as resolved',
      });
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
            No active sync errors found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {errors.map(error => (
            <Card key={error.id} className="border-red-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                    <CardTitle className="text-base">{error.error_type}</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resolveError(error.id)}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{error.error_message}</p>
                <p className="text-xs text-muted-foreground">
                  Occurred: {new Date(error.created_at).toLocaleString()}
                </p>
                {error.record_data && (
                  <div className="mt-2">
                    <details>
                      <summary className="text-xs cursor-pointer hover:text-blue-600">
                        View record data
                      </summary>
                      <pre className="mt-2 p-2 bg-muted text-xs overflow-auto max-h-[200px] rounded">
                        {JSON.stringify(error.record_data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncErrorsView;
