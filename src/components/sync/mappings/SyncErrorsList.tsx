
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GlSyncRecord } from '@/types/glsync';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SyncErrorsListProps {
  errors: GlSyncRecord[];
  isLoading: boolean;
  onResolve: (errorId: string, notes?: string) => Promise<boolean>;
}

const SyncErrorsList: React.FC<SyncErrorsListProps> = ({ errors, isLoading, onResolve }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading errors...</span>
      </div>
    );
  }

  if (!errors.length) {
    return (
      <div className="text-center p-4 bg-green-50 rounded-md">
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <p className="font-medium text-green-600">No sync errors found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Everything is working correctly
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.map((error) => (
        <Card key={error.id} className="overflow-hidden border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium">{error.type}: {error.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                  {error.record && (
                    <pre className="mt-2 p-2 bg-muted text-xs rounded-md max-h-40 overflow-auto">
                      {JSON.stringify(error.record, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onResolve(error.id || '')}
                disabled={error.resolved}
              >
                {error.resolved ? 'Resolved' : 'Mark Resolved'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SyncErrorsList;
