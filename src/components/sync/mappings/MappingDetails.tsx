import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import { ColumnMappingsView } from './ColumnMappingsView';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SyncErrorsView from './SyncErrorsView';
import SyncLogsView from './SyncLogsView';

interface MappingDetailsProps {
  mapping?: GlMapping;
  mappingId: string;
  onBack: () => void;
}

export const MappingDetails: React.FC<MappingDetailsProps> = ({
  mapping,
  mappingId,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<string>("columns");
  const { toast } = useToast();

  const handleMappingUpdate = async () => {
    try {
      const { error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncMapping',
          mappingId: mappingId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Mapping Synced',
        description: 'Mapping has been synced successfully.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync mapping';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Mapping Details</CardTitle>
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mappings
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {mapping && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {mapping.glide_table} 
                <span className="text-muted-foreground ml-2">
                  to {mapping.supabase_table}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Tabs defaultValue="columns" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="columns">Column Mappings</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
                <TabsTrigger value="logs">Sync Logs</TabsTrigger>
              </TabsList>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMappingUpdate}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
            
            <TabsContent value="columns">
              <ColumnMappingsView 
                mappingId={mappingId} 
                glideTable={mapping.glide_table}
                supabaseTable={mapping.supabase_table}
                columnMappings={mapping.column_mappings}
                onMappingUpdate={handleMappingUpdate}
              />
            </TabsContent>
            
            <TabsContent value="errors">
              <SyncErrorsView mappingId={mappingId} />
            </TabsContent>
            
            <TabsContent value="logs">
              <SyncLogsView mappingId={mappingId} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
