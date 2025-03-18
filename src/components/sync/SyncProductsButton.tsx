
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlMapping } from '@/types/glsync';

interface SyncProductsButtonProps {
  mapping: GlMapping;
  onSyncComplete?: () => void;
}

const SyncProductsButton: React.FC<SyncProductsButtonProps> = ({ mapping, onSyncComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);
    
    try {
      const result = await glSyncApi.syncData(mapping.connection_id, mapping.id);
      
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
    } finally {
      setIsLoading(false);
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
        'Sync Products'
      )}
    </Button>
  );
};

export default SyncProductsButton;
