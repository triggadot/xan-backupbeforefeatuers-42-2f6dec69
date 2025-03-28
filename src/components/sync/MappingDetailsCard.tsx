import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlMapping, GlSyncStatus } from '@/types/glsync';
import { ArrowRightLeft, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncValidation } from '@/hooks/useGlSyncValidation';
import { SyncStatusDisplay, ValidationDisplay, ValidationResult } from './ui/StatusDisplay';

export interface MappingDetailsCardProps {
  mapping: GlMapping;
  connectionName?: string | null;
  onSyncComplete?: () => void;
  status?: GlSyncStatus | null;
  onEdit: (mapping: GlMapping) => void;
  onDelete: (mappingId: string) => void;
}

export function MappingDetailsCard({ 
  mapping,
  connectionName,
  onSyncComplete,
  status,
  onEdit,
  onDelete
}: MappingDetailsCardProps) {
  const { syncData, isLoading: isSyncing, retryFailedSync, syncMappingById } = useGlSync();
  const { validating, validation, validateMappingConfig } = useGlSyncValidation();

  useEffect(() => {
    // Auto-validate when component loads
    validateMappingConfig(mapping.id);
  }, [mapping.id, validateMappingConfig]);

  const handleRetry = async () => {
    if (status?.current_status === 'failed') {
      // Updated to pass both connectionId and mappingId
      const success = await retryFailedSync(mapping.connection_id, mapping.id);
      if (success && onSyncComplete) {
        onSyncComplete();
      }
    }
  };

  const handleSync = async () => {
    if (validation && !validation.isValid) return;
    
    // Use the new syncMappingById function
    const success = await syncMappingById(mapping.id);
    
    if (success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const getSyncDirectionIcon = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return <ArrowDown className="h-4 w-4 mr-1" />;
      case 'to_glide':
        return <ArrowUp className="h-4 w-4 mr-1" />;
      case 'both':
        return <ArrowRightLeft className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getSyncDirectionLabel = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return 'Glide → Supabase';
      case 'to_glide':
        return 'Supabase → Glide';
      case 'both':
        return 'Bidirectional';
      default:
        return 'Unknown';
    }
  };

  const calculateProgress = () => {
    if (!status) return 0;
    
    if (status.records_processed === null || status.total_records === null || status.total_records === 0) {
      return 0;
    }
    
    return Math.min(100, Math.round((status.records_processed / status.total_records) * 100));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{mapping.glide_table_display_name}</CardTitle>
            <CardDescription>
              {mapping.supabase_table} · {Object.keys(mapping.column_mappings).length} column(s) mapped
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={mapping.enabled ? 'default' : 'outline'} className={mapping.enabled ? 'bg-green-500' : ''}>
              {mapping.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Sync Direction</p>
            <div className="flex items-center text-sm">
              {getSyncDirectionIcon()}
              {getSyncDirectionLabel()}
            </div>
          </div>
        </div>
        
        <ValidationDisplay validation={validation} />
        <SyncStatusDisplay status={status} />
        
        {status && (status.current_status === 'processing' || status.current_status === 'started') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sync Progress</span>
              <span>
                {status.records_processed !== null ? status.records_processed : 0} 
                {' '}/{' '}
                {status.total_records !== null ? status.total_records : '?'}
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(mapping)}
          >
            Edit
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            className="flex-1 text-red-500 hover:text-red-600"
            onClick={() => onDelete(mapping.id)}
          >
            Delete
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => validateMappingConfig(mapping.id)}
            disabled={validating}
          >
            {validating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating
              </>
            ) : (
              'Validate'
            )}
          </Button>
          {status?.current_status === 'failed' && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleRetry}
              disabled={isSyncing}
            >
              Retry
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm"
            className="flex-1" 
            onClick={handleSync}
            disabled={isSyncing || (validation && !validation.isValid)}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing
              </>
            ) : (
              'Sync Now'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
