import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2, Pencil, Save, X } from 'lucide-react';
import { GlMapping, GlConnection } from '@/types/glsync';
import { ColumnMappingsView } from './ColumnMappingsView';
import { useToast } from '@/hooks/utils/use-toast';
import { SyncErrorsView } from './SyncErrorsView';
import { SyncLogsView } from './SyncLogsView';
import { useIsMobile } from '@/hooks/utils/use-is-mobile';
import { motion } from 'framer-motion';
import { useGlSync } from '@/hooks/gl-sync';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MappingDetailsProps {
  mapping?: GlMapping;
  mappingId: string;
  onBack: () => void;
}

export const MappingDetails: React.FC<MappingDetailsProps> = ({
  mapping: initialMapping,
  mappingId,
  onBack
}) => {
  const [mapping, setMapping] = useState<GlMapping | undefined>(initialMapping);
  const [activeTab, setActiveTab] = useState<string>("columns");
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { syncMappingById } = useGlSync();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery<GlConnection[], Error>({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gl_connections').select('*');
      if (error) {
        console.error("Error fetching connections:", error);
        throw new Error(error.message || 'Failed to fetch connections');
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: updateMappingMutate, isPending: isUpdating } = useMutation<
    GlMapping,
    Error,
    { mappingId: string; updates: Partial<Pick<GlMapping, 'connection_id' | 'column_mappings'>> }
  >({
    mutationFn: async ({ mappingId, updates }) => {
      const { data, error } = await supabase
        .from('gl_mappings')
        .update(updates)
        .eq('id', mappingId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update mapping');
      }
      if (!data) {
        throw new Error('No data returned after update');
      }
      return data as GlMapping;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['mappings', mappingId] });
      queryClient.invalidateQueries({ queryKey: ['mappings'] });

      setMapping(updatedData);
      setIsDetailsEditing(false);
      toast({ title: "Mapping updated successfully!" });
    },
    onError: (error) => {
      console.error("Failed to update mapping:", error);
      toast({ title: "Update Failed", description: error.message, variant: 'destructive' });
    },
  });

  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');

  useEffect(() => {
    setMapping(initialMapping);
    if (initialMapping) {
      setSelectedConnectionId(initialMapping.connection_id || '');
    }
  }, [initialMapping]);

  const handleSync = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsSyncing(true);

    try {
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
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }
  };

  const handleDetailsEditToggle = () => {
    if (!isDetailsEditing && mapping) {
      setSelectedConnectionId(mapping.connection_id || '');
    }
    setIsDetailsEditing(!isDetailsEditing);
  };

  const handleDetailsCancel = () => {
    if (mapping) {
      setSelectedConnectionId(mapping.connection_id || '');
    }
    setIsDetailsEditing(false);
  };

  const handleDetailsSave = async () => {
    if (!mapping || !selectedConnectionId) return;

    updateMappingMutate({ mappingId: mapping.id, updates: { connection_id: selectedConnectionId } });
  };

  const handleColumnMappingUpdate = async (updatedMappingData: GlMapping) => {
    updateMappingMutate({
      mappingId: updatedMappingData.id,
      updates: { column_mappings: updatedMappingData.column_mappings }
    });
  };

  const getCurrentConnectionName = () => {
    if (isLoadingConnections || !mapping?.connection_id) return mapping?.connection_id || 'Loading...';
    const currentConnection = connections.find(c => c.connection_id === mapping.connection_id);
    return currentConnection?.app_name || mapping.connection_id || 'Unknown Connection';
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-grow">
                  <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} truncate mb-1`}>
                    {mapping.glide_table}
                    <span className="text-muted-foreground mx-2 text-sm sm:text-base">
                      to
                    </span>
                    {mapping.supabase_table}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>Connection:</span>
                    {isDetailsEditing ? (
                      <Select
                        value={selectedConnectionId}
                        onValueChange={setSelectedConnectionId}
                        disabled={isLoadingConnections || isUpdating}
                      >
                        <SelectTrigger className="h-8 w-[250px]">
                          <SelectValue placeholder="Select Connection..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingConnections ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : (
                            connections.map(conn => (
                              <SelectItem key={conn.connection_id} value={conn.connection_id}>
                                {conn.app_name} ({conn.connection_id})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <strong>{getCurrentConnectionName()}</strong>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isDetailsEditing ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleDetailsCancel} disabled={isUpdating}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleDetailsSave} disabled={isUpdating || isLoadingConnections}>
                        {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Save className="h-4 w-4 mr-1" />}
                        {isUpdating ? 'Saving...' : 'Save Details'}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleDetailsEditToggle}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit Details
                    </Button>
                  )}
                </div>
              </div>
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
                onMappingUpdate={handleColumnMappingUpdate}
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
