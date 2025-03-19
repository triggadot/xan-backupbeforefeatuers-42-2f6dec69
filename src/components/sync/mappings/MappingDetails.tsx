
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useToast } from '@/hooks/use-toast';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';
import { MappingDetailsCard } from '@/components/sync/MappingDetailsCard';
import ColumnMappingsView from './ColumnMappingsView';
import SyncErrorsView from '@/components/sync/mappings/SyncErrorsView';
import { SyncLogsView } from '@/components/sync/mappings/SyncLogsView';
import { ValidationDisplay } from '@/components/sync/ValidationDisplay';
import { SyncStatusMessage } from '@/components/sync/SyncStatusMessage';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

interface MappingTabsProps {
  mapping: GlMapping;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

const MappingTabs: React.FC<MappingTabsProps> = ({ mapping, onSync, isSyncing }) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <Card>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
            <TabsTrigger value="sync-errors">Sync Errors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <MappingDetailsCard 
              mapping={mapping}
              onEdit={() => {}} 
              onDelete={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="columns" className="space-y-4">
            <ColumnMappingsView mapping={mapping} />
          </TabsContent>
          
          <TabsContent value="sync-logs" className="space-y-4">
            <SyncLogsView mappingId={mapping.id} />
          </TabsContent>
          
          <TabsContent value="sync-errors" className="space-y-4">
            <SyncErrorsView mappingId={mapping.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const { syncData, isLoading: isSyncing } = useGlSync();
  const { status, isLoading, error, refetch } = useGlSyncStatus(mappingId);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMapping = async () => {
      try {
        const { data, error } = await supabase
          .from('gl_mappings')
          .select('*')
          .eq('id', mappingId)
          .single();
        
        if (error) throw error;
        
        // Ensure column_mappings is an object
        const mappingData = {
          ...data,
          column_mappings: data.column_mappings as Record<string, {
            glide_column_name: string;
            supabase_column_name: string;
            data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
          }>
        } as GlMapping;
        
        setMapping(mappingData);
      } catch (error) {
        console.error('Error fetching mapping:', error);
        toast({
          title: 'Error',
          description: 'Failed to load mapping details',
          variant: 'destructive',
        });
      }
    };
    
    fetchMapping();
  }, [mappingId, toast]);

  const handleSync = async () => {
    if (!mapping) return;
    
    try {
      await syncData(mapping.connection_id, mapping.id);
      toast({
        title: 'Sync Started',
        description: 'Sync operation has been started.',
      });
      refetch();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to start sync operation.',
        variant: 'destructive',
      });
    }
  };

  if (!mapping) {
    return (
      <Card>
        <CardContent className="p-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Loading...</h2>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <Button onClick={onBack} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        <h1 className="text-2xl font-bold mt-2">Mapping Details</h1>
        <SyncStatusMessage status={status} isLoading={isLoading} error={error} />
        <ValidationDisplay mapping={mapping} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <MappingTabs 
            mapping={mapping} 
            onSync={handleSync} 
            isSyncing={isSyncing}
          />
        </div>
        
        <div>
          <SyncControlPanel 
            mapping={mapping} 
            status={status}
            onSyncComplete={refetch}
            onSettingsChange={refetch}
          />
        </div>
      </div>
    </div>
  );
};

export default MappingDetails;
