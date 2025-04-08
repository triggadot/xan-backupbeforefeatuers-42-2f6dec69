import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import { ColumnMappingsView } from './ColumnMappingsView';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SyncErrorsView } from './SyncErrorsView';
import { SyncLogsView } from './SyncLogsView';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleMappingUpdate = async () => {
    try {
      setIsSyncing(true);
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
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl truncate max-w-[250px] sm:max-w-none">Mapping Details</CardTitle>
            <Button variant="ghost" onClick={onBack} size={isMobile ? "sm" : "default"} className="self-start sm:self-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mappings
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {mapping && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} truncate`}>
                {mapping.glide_table} 
                <span className="text-muted-foreground ml-2 text-sm sm:text-base">
                  to {mapping.supabase_table}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Tabs defaultValue="columns" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList className={isMobile ? "w-full grid grid-cols-3" : ""}>
                <TabsTrigger value="columns" className={isMobile ? "text-xs py-1.5" : ""}>Column Mappings</TabsTrigger>
                <TabsTrigger value="errors" className={isMobile ? "text-xs py-1.5" : ""}>Errors</TabsTrigger>
                <TabsTrigger value="logs" className={isMobile ? "text-xs py-1.5" : ""}>Sync Logs</TabsTrigger>
              </TabsList>
              
              <Button 
                variant="outline" 
                size={isMobile ? "sm" : "default"}
                onClick={handleMappingUpdate}
                disabled={isSyncing}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
            
            <TabsContent value="columns" className="animate-fade-in">
              <ColumnMappingsView 
                mapping={mapping}
                glideTable={mapping.glide_table}
                supabaseTable={mapping.supabase_table}
                columnMappings={mapping.column_mappings}
                onMappingUpdate={handleMappingUpdate}
              />
            </TabsContent>
            
            <TabsContent value="errors" className="animate-fade-in">
              <SyncErrorsView mappingId={mappingId} />
            </TabsContent>
            
            <TabsContent value="logs" className="animate-fade-in">
              <SyncLogsView mappingId={mappingId} />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
};
