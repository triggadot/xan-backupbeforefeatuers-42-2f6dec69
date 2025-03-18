
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Loader2, PlayCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GlMapping, GlSyncStatus } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';
import { useGlSync } from '@/hooks/useGlSync';
import { useToast } from '@/hooks/use-toast';

interface SyncControlPanelProps {
  mapping: GlMapping;
  status?: GlSyncStatus | null;
  onSyncComplete?: () => void;
  onSettingsChange?: () => void;
}

export function SyncControlPanel({ 
  mapping, 
  status, 
  onSyncComplete,
  onSettingsChange
}: SyncControlPanelProps) {
  const [syncMode, setSyncMode] = useState<string>(mapping.sync_direction);
  const [isEnabled, setIsEnabled] = useState<boolean>(mapping.enabled);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { syncData, isLoading: isSyncing, retryFailedSync } = useGlSync();
  const { toast } = useToast();

  const handleSyncDirectionChange = (value: string) => {
    setSyncMode(value);
  };

  const handleEnableToggle = (checked: boolean) => {
    setIsEnabled(checked);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({
          sync_direction: syncMode,
          enabled: isEnabled,
        })
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      toast({
        title: 'Settings saved',
        description: 'Sync settings have been updated successfully.',
      });
      
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!mapping.enabled) return;
    
    const result = await syncData(mapping.connection_id, mapping.id);
    
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  const handleRetry = async () => {
    if (status?.current_status === 'failed') {
      const success = await retryFailedSync(mapping.id);
      if (success && onSyncComplete) {
        onSyncComplete();
      }
    }
  };

  const isInProgress = status?.current_status === 'processing' || status?.current_status === 'started';
  const isModified = syncMode !== mapping.sync_direction || isEnabled !== mapping.enabled;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sync Controls</CardTitle>
        <CardDescription>Configure and manage sync operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInProgress && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertTitle>Sync in Progress</AlertTitle>
            <AlertDescription>
              A sync operation is currently running. Please wait for it to complete.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sync-direction">Sync Direction</Label>
            <Select 
              disabled={isInProgress || isSyncing}
              value={syncMode} 
              onValueChange={handleSyncDirectionChange}
            >
              <SelectTrigger id="sync-direction">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_supabase">Glide → Supabase</SelectItem>
                <SelectItem value="to_glide">Supabase → Glide</SelectItem>
                <SelectItem value="both">Bidirectional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mapping-enabled">Enable Sync</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable sync operations
              </p>
            </div>
            <Switch 
              id="mapping-enabled" 
              checked={isEnabled}
              onCheckedChange={handleEnableToggle}
              disabled={isInProgress || isSyncing}
            />
          </div>
        </div>

        {!mapping.enabled && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Sync Disabled</AlertTitle>
            <AlertDescription>
              This mapping is currently disabled. Enable it to perform sync operations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          variant="outline"
          onClick={saveSettings}
          disabled={!isModified || isInProgress || isSyncing || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {status?.current_status === 'failed' && (
            <Button
              variant="secondary"
              onClick={handleRetry}
              disabled={isSyncing || isInProgress}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Failed
            </Button>
          )}
          
          <Button 
            variant="default" 
            onClick={handleSync}
            disabled={isSyncing || !mapping.enabled || isInProgress}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
