
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GlMapping } from '@/types/glsync';
import { useGlSync } from '@/hooks/useGlSync';

interface SyncProductsButtonProps {
  mapping: GlMapping;
  onSyncComplete?: () => void;
}

export const SyncProductsButton: React.FC<SyncProductsButtonProps> = ({ mapping, onSyncComplete }) => {
  const { syncData, isLoading } = useGlSync();
  const { toast } = useToast();

  const handleSync = async () => {
    if (!mapping.enabled) {
      toast({
        title: 'Mapping is disabled',
        description: 'Please enable the mapping before syncing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await syncData(mapping.connection_id, mapping.id);
      
      if (result.success) {
        toast({
          title: 'Products synced successfully',
          description: `Processed ${result.recordsProcessed} records`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Sync encountered issues',
          description: result.error || `Processed ${result.recordsProcessed} records with ${result.failedRecords} failures`,
          variant: 'destructive',
        });
      }
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const getSyncDirectionIcon = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return <ArrowRight className="mr-2 h-4 w-4" />;
      case 'to_glide':
        return <ArrowLeft className="mr-2 h-4 w-4" />;
      case 'both':
        return <ArrowRightLeft className="mr-2 h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isLoading || !mapping.enabled}
      variant="default"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing Products...
        </>
      ) : (
        <>
          {getSyncDirectionIcon()}
          Sync Products
        </>
      )}
    </Button>
  );
};

export default SyncProductsButton;
