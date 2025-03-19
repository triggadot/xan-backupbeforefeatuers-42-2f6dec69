
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SyncDetailsPanel } from '../SyncDetailsPanel';
import { ColumnMappingsView } from './ColumnMappingsView';
import { SyncLogsView } from './SyncLogsView';
import { GlSyncRecord } from '@/types/glsync';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useProductMapping } from '@/hooks/useProductMapping';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  console.log("MappingDetails component mounted with mappingId:", mappingId);
  
  const { mapping, connection, isLoading, error, refetch } = useProductMapping(mappingId);
  const { 
    syncErrors, 
    isLoading: isLoadingErrors, 
    refreshErrors, 
    setIncludeResolved, 
    includeResolved 
  } = useGlSyncErrors(mappingId);
  
  const hasRowIdMapping = mapping?.column_mappings && 
    Object.entries(mapping.column_mappings).some(
      ([key, columnMapping]) => 
        key === '$rowID' && 
        columnMapping.supabase_column_name === 'glide_row_id'
    );

  useEffect(() => {
    console.log("Mapping loaded:", mapping);
    if (mapping?.column_mappings) {
      console.log("Column mappings:", mapping.column_mappings);
    }
  }, [mapping]);

  const toggleIncludeResolved = () => {
    setIncludeResolved(!includeResolved);
    refreshErrors(includeResolved);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading mapping details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SyncDetailsPanel mapping={mapping} error={error} />
        <ColumnMappingsView mapping={mapping} error={error} />
      </div>

      <SyncLogsView mappingId={mappingId} />
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sync Errors</h3>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleIncludeResolved}
              >
                {includeResolved ? 'Hide Resolved' : 'Show Resolved'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshErrors(includeResolved)}
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {isLoadingErrors ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading sync errors...</span>
            </div>
          ) : syncErrors.length > 0 ? (
            <div className="space-y-4">
              {syncErrors.map((error: GlSyncRecord) => (
                <div 
                  key={error.id} 
                  className={`border p-4 rounded-md ${error.resolved ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {error.resolved && (
                          <span className="text-green-500 mr-2">[Resolved]</span>
                        )}
                        {error.type}: {error.message}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {error.record && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-500">View Record Data</summary>
                      <pre className="bg-gray-100 p-2 mt-2 rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(error.record, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No sync errors found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MappingDetails;
