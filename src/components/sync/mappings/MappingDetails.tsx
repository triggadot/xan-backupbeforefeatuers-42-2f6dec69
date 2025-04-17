import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { GlMapping, GlConnection } from '@/types/glide-sync/glsync';
import { ColumnMappingsView } from './ColumnMappingsView';
import { useToast } from '@/hooks/utils/use-toast';
import { SyncErrorsView } from './SyncErrorsView';
import { SyncLogsView } from './SyncLogsView';
import { useIsMobile } from '@/hooks/utils/use-is-mobile';
import { motion } from 'framer-motion';
import { useGlSync } from '@/hooks/gl-sync';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SplitButtonDropdown } from '@/components/custom/SplitButtonDropdown';

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

  console.log('[MappingDetails] Render Start. initialMapping received:', initialMapping ? `ID: ${initialMapping.id}` : 'undefined', 'Current mapping state:', mapping ? `ID: ${mapping.id}` : 'undefined');

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
      console.log('[Mutation] Running update for mappingId:', mappingId, 'with updates:', updates);
      if (Object.keys(updates).length === 0) {
        console.warn("[Mutation] Update called with no changes.");
        if (mapping) return mapping;
        else throw new Error("[Mutation] No mapping data available for no-op update.");
      }

      const { data, error } = await supabase
        .from('gl_mappings')
        .update(updates)
        .eq('id', mappingId)
        .select()
        .single();

      if (error) {
        console.error('[Mutation] Supabase update error:', error);
        throw new Error(error.message || 'Failed to update mapping');
      }
      if (!data) {
        console.error('[Mutation] No data returned after update');
        throw new Error('No data returned after update');
      }
      console.log('[Mutation] Update successful, returned data:', data);
      return data as GlMapping;
    },
    onSuccess: (updatedData) => {
      console.log('[Mutation] onSuccess. Updated data:', updatedData);
      queryClient.invalidateQueries({ queryKey: ['mappings', mappingId] });
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
      setMapping(updatedData);
      toast({ title: "Update Successful!", description: "Mapping details have been saved." });
    },
    onError: (error) => {
      console.error("[Mutation] onError:", error);
      toast({ title: "Update Failed", description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    console.log('[MappingDetails] useEffect triggered. initialMapping:', initialMapping);
    if (initialMapping) {
      setMapping(initialMapping);
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
      setIsSyncing(false);
    }
  };

  const handleColumnMappingUpdate = (updatedMappingData: GlMapping) => {
    if (mapping?.id) {
      console.log('[handleColumnMappingUpdate] Triggering mutation for columns. Mapping ID:', mapping.id);
      updateMappingMutate({ mappingId: mapping.id, updates: { column_mappings: updatedMappingData.column_mappings } });
    } else {
      console.error('[handleColumnMappingUpdate] Cannot update column mappings: mapping or mapping.id is undefined.');
      toast({ title: "Error", description: "Cannot update column mappings: mapping data missing.", variant: "destructive" });
    }
  };

  const handleConnectionChange = (selectedConnectionId: string) => {
    if (!mapping) return; // Should not happen if dropdown is enabled

    console.log(`[MappingDetails] Connection changed. New selected ID: ${selectedConnectionId}`);
    // Update the mapping in the database
    updateMappingMutate({ 
      mappingId: mapping.id,
      // Update the connection_id field with the selected connection's *id*
      updates: { connection_id: selectedConnectionId } 
    });
  };

  const connectionOptions = useMemo(() => {
    console.log('[MappingDetails] useMemo calculating connectionOptions. isLoadingConnections:', isLoadingConnections);
    console.log('[MappingDetails] Raw connections data:', JSON.stringify(connections)); // Log raw data

    if (isLoadingConnections || !connections || connections.length === 0) {
      console.log('[MappingDetails] useMemo: Returning empty options (loading or no data).');
      return [];
    }

    console.log('[MappingDetails] useMemo: Starting filter/map process...');
    // Filter connections rigorously before mapping - Use conn.id!
    const filteredConnections = connections.filter(conn => {
      const isValid = conn && typeof conn.id === 'string' && conn.id.length > 0;
      // Log each connection being filtered
      console.log(`[MappingDetails] Filtering conn: ${JSON.stringify(conn)}, IsValid: ${isValid}`); 
      return isValid;
    });
    
    console.log('[MappingDetails] useMemo: Filtered connections:', JSON.stringify(filteredConnections));

    return filteredConnections.map(conn => {
      // Log connection right before mapping/slicing - Use conn.id!
      console.log(`[MappingDetails] Mapping valid conn: ${JSON.stringify(conn)}`);
      try {
        const idSuffix = ` (...${conn.id.slice(-6)})`; // Use conn.id
        const namePart = conn.app_name || 'Connection';
        const label = `${namePart}${idSuffix}`;
        console.log(`[MappingDetails] Mapped conn to label: ${label}`);
        return { label, value: conn.id }; // Use conn.id as value
      } catch (e) {
        console.error(`[MappingDetails] Error slicing/mapping id for conn: ${JSON.stringify(conn)}`, e);
        // Optionally return a fallback or skip this item
        return null; // Return null for problematic items
      }
    }).filter(option => option !== null); // Filter out any nulls caused by errors

  }, [connections, isLoadingConnections]); // Add semicolon here

  // Safely determine the initial selected value for the dropdown - Use mapping.connection_id
  const initialSelectedDropdownValue = useMemo(() => {
    console.log('[MappingDetails] useMemo calculating initialSelectedDropdownValue. Mapping:', mapping);
    // Check the connection_id field on the mapping object itself
    if (mapping && typeof mapping.connection_id === 'string') {
      return mapping.connection_id;
    }
    return undefined;
  }, [mapping]); // Add semicolon here

  // Effect to update local state when prop changes
  useEffect(() => {
    console.log('[MappingDetails] useEffect triggered. initialMapping:', initialMapping);
    if (initialMapping) {
      setMapping(initialMapping);
    }
  }, [initialMapping]);

  if (!mapping && !initialMapping) {
    console.log('[MappingDetails] Render: Showing loading state (no mapping data yet).');
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading mapping data...</div>;
  }

  if (!mapping && initialMapping) {
    console.log('[MappingDetails] Render: Setting mapping state from initialMapping.');
    setMapping(initialMapping);
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Initializing...</div>;
  }

  if (!mapping) {
    console.error('[MappingDetails] Render: Mapping is still undefined after checks. This should not happen.');
    return <div className="p-4 text-red-600">Error: Failed to load mapping details. Please go back and try again.</div>;
  }

  console.log('[MappingDetails] Render: Proceeding with render. Mapping ID:', mapping.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
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

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {mapping ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Conditional Rendering for Connection Section */}
            {isLoadingConnections ? (
              // State 1: Connections are loading
              <Card className="mb-6">
                <CardHeader><div className="text-sm text-muted-foreground flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading connections...</div></CardHeader>
              </Card>
            ) : connectionOptions.length > 0 ? (
              // State 2: Connections loaded AND we have valid options
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg mb-0.5">
                        {mapping.supabase_table}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground italic">
                        {`ID: ${mapping.glide_table}`}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>Connection:</span>
                      <SplitButtonDropdown
                        key={mapping.connection_id || 'no-connection'}
                        options={connectionOptions}
                        initialSelectedValue={initialSelectedDropdownValue}
                        onSelectionChange={handleConnectionChange}
                        placeholder="Select Connection..."
                        disabled={isUpdating || connectionOptions.length === 0}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ) : (
              // State 3: Connections loaded but NO valid options found (or array is empty after filtering)
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg mb-0.5">
                        {mapping.supabase_table}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground italic">
                        {`ID: ${mapping.glide_table}`}
                      </p>
                    </div>
                    <div className="text-sm text-destructive flex items-center gap-2 self-start sm:self-center mt-2 sm:mt-0">
                      <AlertCircle className="h-4 w-4 mr-1" /> No valid connections
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

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
                <SyncErrorsView mappingId={mapping.id} />
              </TabsContent>

              <TabsContent value="logs" className="animate-fade-in">
                <SyncLogsView mappingId={mapping.id} />
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          // Add the missing else part: Show loading indicator if mapping object itself isn't ready
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading mapping content...
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
