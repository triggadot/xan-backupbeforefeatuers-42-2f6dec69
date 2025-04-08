import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/utils/use-toast';
import { useGlSync } from '@/hooks/gl-sync';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  connectionId: string;
  mappingId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncComplete?: () => void;
  label?: string;
  showIcon?: boolean;
}

/**
 * Standardized SyncButton component that uses the updated sync logic
 * with proper error handling and progress tracking.
 * 
 * @param props SyncButtonProps
 * @returns React component
 */
export function SyncButton({
  connectionId,
  mappingId,
  variant = 'default',
  size = 'default',
  className = '',
  onSyncComplete,
  label = 'Sync',
  showIcon = true
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { syncData } = useGlSync();
  const { toast } = useToast();

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsSyncing(true);
    
    try {
      // Use the improved syncData function with progress tracking
      const result = await syncData(connectionId, mappingId, {
        logLevel: 'detailed',
        onProgress: (progress) => {
          // Could use progress for a progress bar in the future
          console.log(`Sync progress: ${progress}%`);
        }
      });
      
      if (result?.success) {
        toast({
          title: "Sync initiated",
          description: `Successfully started sync for ${result.recordsProcessed || 0} records.`,
        });
      } else {
        throw new Error(result?.error || 'Unknown error during sync');
      }
      
      // Call onSyncComplete callback if provided
      if (onSyncComplete) {
        setTimeout(() => {
          onSyncComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      // Clear syncing state after a short delay
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className={cn(className)}
    >
      {isSyncing ? (
        <>
          {showIcon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Syncing...
        </>
      ) : (
        <>
          {showIcon && <RefreshCw className="mr-2 h-4 w-4" />}
          {label}
        </>
      )}
    </Button>
  );
}
