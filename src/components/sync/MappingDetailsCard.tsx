import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlSyncStatus, GlMapping } from '@/types/glsync';
import { CheckCircle, AlertTriangle, ArrowRightLeft, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useGlSync } from '@/hooks/useGlSync';
import { SyncErrorDisplay } from './SyncErrorDisplay';
import { validateMapping } from '@/utils/gl-mapping-validator';
import { useToast } from '@/hooks/use-toast';

interface MappingDetailsCardProps {
  mapping: GlMapping;
  connectionName?: string | null;
  onSyncComplete?: () => void;
}

export function MappingDetailsCard({ 
  mapping,
  connectionName,
  onSyncComplete
}: MappingDetailsCardProps) {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();
  const { syncErrors, isLoading: isLoadingErrors, resolveError } = useGlSyncErrors(mapping.id);
  const { retryFailedSync } = useGlSync();

  const validateMappingConfig = async () => {
    setValidating(true);
    try {
      const result = await validateMapping(mapping.id);
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
      if (result.is_valid) {
        toast({
          title: 'Validation successful',
          description: result.validation_message,
        });
      } else {
        toast({
          title: 'Validation failed',
          description: result.validation_message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Validation error',
        description: `Could not validate mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      setValidation({
        isValid: false,
        message: `Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    // Auto-validate when component loads
    validateMappingConfig();
  }, [mapping.id]);

  const handleRetry = async () => {
    if (status?.current_status === 'failed') {
      const success = await retryFailedSync(mapping.id);
      if (success) {
        toast({
          title: 'Retry initiated',
          description: 'The failed sync has been restarted.'
        });
      }
    }
  };

  const handleSync = async () => {
    // Only allow sync if validation is successful or not yet performed
    if (validation && !validation.isValid) {
      toast({
        title: 'Cannot sync',
        description: 'Please fix the validation errors before syncing',
        variant: 'destructive'
      });
      return;
    }
    
    await onSync(mapping.id);
    if (onSyncComplete) {
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

  const getStatusBadge = () => {
    if (!status?.current_status) {
      return <Badge variant="outline">Not synced</Badge>;
    }

    switch (status.current_status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500">Started</Badge>;
      default:
        return <Badge variant="outline">{status.current_status}</Badge>;
    }
  };

  const calculateProgress = () => {
    if (!status) return 0;
    
    if (status.records_processed === null || status.total_records === null || status.total_records === 0) {
      return 0;
    }
    
    return Math.min(100, Math.round((status.records_processed / status.total_records) * 100));
  };

  const getLastSyncTime = () => {
    if (!status?.last_sync_completed_at) return 'Never';
    
    try {
      return formatDistance(new Date(status.last_sync_completed_at), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  const getErrorCount = () => {
    if (!status) return 0;
    return status.error_count || 0;
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
            {getStatusBadge()}
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
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Last Sync</p>
            <p className="text-sm">{getLastSyncTime()}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Status</p>
            <div className="flex items-center gap-2">
              {status?.current_status === 'processing' ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : status?.current_status === 'completed' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : status?.current_status === 'failed' ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span className="text-sm">
                {status?.current_status ? 
                  status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1) :
                  'Not synced'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Validation Status */}
        {validation && (
          <div className={`p-3 rounded-md ${validation.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-start gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <h4 className={`text-sm font-medium ${validation.isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {validation.isValid ? 'Validation Successful' : 'Validation Failed'}
                </h4>
                <p className="text-sm mt-1">{validation.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Sync Progress */}
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
        
        {/* Error summary */}
        {getErrorCount() > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {getErrorCount()} error{getErrorCount() !== 1 ? 's' : ''} detected
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                There are sync errors that require your attention
              </p>
            </div>
          </div>
        )}
        
        {/* Error display */}
        {syncErrors.length > 0 && (
          <SyncErrorDisplay 
            syncErrors={syncErrors} 
            onResolve={resolveError}
            className="mt-4" 
          />
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
            onClick={validateMappingConfig}
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
