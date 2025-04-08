import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import { ColumnMappingsView } from './ColumnMappingsView';
import { useToast } from '@/hooks/use-toast';
import { SyncErrorsView } from './SyncErrorsView';
import { SyncLogsView } from './SyncLogsView';
import { useIsMobile } from '@/hooks/useIsMobile';
import { motion } from 'framer-motion';
import { useGlSync } from '@/hooks/useGlSync';

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
  const { syncMappingById } = useGlSync();

  const handleSync = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Set syncing state
    setIsSyncing(true);
    
    try {
      // Use the syncMappingById function from useGlSync hook
      const success = await syncMappingById(mappingId);
      
      if (!success) {
        throw new Error('Sync operation failed');
      }
      
      toast({
        title: 'Sync Successful',
        description: 'Data synchronized successfully.',
      });
    } catch (err) {
      console.error("Sync error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync mapping';
      toast({
        title: 'Sync Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      // Clear syncing state after a short delay
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
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
                onClick={(e) => handleSync(e)}
                disabled={isSyncing}
                className="w-full sm:w-auto"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
            
            <TabsContent value="columns" className="animate-fade-in">
              <ColumnMappingsView 
                mapping={mapping}
                glideTable={mapping.glide_table}
                supabaseTable={mapping.supabase_table}
                columnMappings={mapping.column_mappings}
                onMappingUpdate={() => handleSync()}
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
