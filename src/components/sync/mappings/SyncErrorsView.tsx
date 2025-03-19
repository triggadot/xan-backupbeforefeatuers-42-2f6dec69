
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { glSyncApi } from '@/services/glsync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SyncErrorsViewProps {
  mappingId: string;
}

const SyncErrorsView: React.FC<SyncErrorsViewProps> = ({ mappingId }) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['syncErrors', mappingId],
    queryFn: async () => {
      const response = await glSyncApi.getSyncErrors(mappingId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load sync errors');
      }
      return response.errors || [];
    }
  });

  const errors = data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">Sync Errors</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="ml-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-2"></div>
            <div className="h-10 bg-muted rounded mb-2"></div>
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No errors found
          </div>
        ) : (
          <div className="space-y-2">
            {errors.slice(0, 3).map((error) => (
              <div key={error.id} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{error.error_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {error.error_message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {errors.length > 3 && (
              <div className="text-center text-sm text-muted-foreground pt-1">
                + {errors.length - 3} more errors
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncErrorsView;
