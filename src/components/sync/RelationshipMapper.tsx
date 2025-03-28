
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, RefreshCw, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { useGlSync } from '@/hooks/useGlSync';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

export function RelationshipMapper() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [pendingMappings, setPendingMappings] = useState<number>(0);
  const [completedMappings, setCompletedMappings] = useState<number>(0);
  const [failedMappings, setFailedMappings] = useState<number>(0);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('status');
  const { mapAllRelationships, isRelationshipMapping, checkRelationshipStatus, relationshipStatus } = useGlSync();
  const { toast } = useToast();

  // Load tables for mapping
  useEffect(() => {
    const fetchTables = async () => {
      setIsLoadingStatus(true);
      try {
        const { data, error } = await supabase
          .from('gl_relationship_mappings')
          .select('supabase_table, target_table')
          .eq('enabled', true);
        
        if (error) throw error;
        
        // Extract unique tables from mappings
        const uniqueTables = [...new Set([
          ...(data?.map(item => item.supabase_table) || []),
          ...(data?.map(item => item.target_table) || [])
        ])];
        
        setTables(uniqueTables);
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    
    fetchTables();
  }, []);

  // Get mapping stats
  useEffect(() => {
    const getMappingStats = async () => {
      setIsLoadingStatus(true);
      try {
        // Get pending count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('gl_relationship_mapping_log')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
          
        if (pendingError) throw pendingError;
        setPendingMappings(pendingCount || 0);
        
        // Get completed count
        const { count: completedCount, error: completedError } = await supabase
          .from('gl_relationship_mapping_log')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
          
        if (completedError) throw completedError;
        setCompletedMappings(completedCount || 0);
        
        // Get failed count
        const { count: failedCount, error: failedError } = await supabase
          .from('gl_relationship_mapping_log')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'error');
          
        if (failedError) throw failedError;
        setFailedMappings(failedCount || 0);
        
      } catch (error) {
        console.error('Error fetching mapping stats:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    
    getMappingStats();
    
    // Setup real-time subscriptions
    const channel = supabase
      .channel('gl-relationship-mapping-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_relationship_mapping_log' }, 
          () => getMappingStats())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMapRelationships = async () => {
    try {
      await checkRelationshipStatus();
      
      if (selectedTable) {
        const success = await mapAllRelationships(selectedTable);
        if (success) {
          toast({
            title: 'Table Relationships Mapped',
            description: `Successfully mapped relationships for table ${selectedTable}.`,
          });
        }
      } else {
        const success = await mapAllRelationships();
        if (success) {
          toast({
            title: 'All Relationships Mapped',
            description: `Successfully mapped relationships across all tables.`,
          });
        }
      }
    } catch (error) {
      console.error('Error mapping relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to map relationships: ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Relationship Mapping</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            onClick={checkRelationshipStatus} 
            disabled={isLoadingStatus}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button 
            onClick={handleMapRelationships} 
            disabled={isRelationshipMapping}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            {isRelationshipMapping ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Map Relationships
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Pending Mappings</h3>
                  {isLoadingStatus ? (
                    <Skeleton className="h-8 w-16 bg-blue-100 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{pendingMappings}</p>
                  )}
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Info className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-green-800">Completed Mappings</h3>
                  {isLoadingStatus ? (
                    <Skeleton className="h-8 w-16 bg-green-100 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{completedMappings}</p>
                  )}
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-red-800">Failed Mappings</h3>
                  {isLoadingStatus ? (
                    <Skeleton className="h-8 w-16 bg-red-100 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600">{failedMappings}</p>
                  )}
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </div>
            
            {relationshipStatus && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Tables with data</h3>
                <div className="flex flex-wrap gap-2">
                  {relationshipStatus.tables.map(table => (
                    <Badge key={table} variant="outline" className="bg-white">
                      {table}
                    </Badge>
                  ))}
                  {relationshipStatus.tables.length === 0 && (
                    <p className="text-sm text-gray-500">No tables found with data</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tables" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {isLoadingStatus ? (
                Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                tables.map(table => (
                  <Button
                    key={table}
                    variant={selectedTable === table ? "default" : "outline"}
                    className="justify-start text-left truncate"
                    onClick={() => setSelectedTable(selectedTable === table ? null : table)}
                  >
                    {table}
                  </Button>
                ))
              )}
            </div>
            
            {selectedTable && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Selected Table: {selectedTable}</h3>
                <Button 
                  onClick={() => handleMapRelationships()} 
                  disabled={isRelationshipMapping}
                  variant="default"
                  size="sm"
                  className="mt-2"
                >
                  {isRelationshipMapping ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Mapping...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Map {selectedTable} Relationships
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="debug" className="space-y-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Recent Logs</h3>
              {isLoadingStatus ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <pre className="text-xs bg-gray-100 p-4 rounded-md overflow-auto max-h-64">
                  {JSON.stringify({ 
                    tables, 
                    pendingMappings, 
                    completedMappings, 
                    failedMappings,
                    relationshipStatus
                  }, null, 2)}
                </pre>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { data, error } = await supabase
                    .from('gl_relationship_mapping_log')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                    
                  if (error) {
                    console.error('Error fetching logs:', error);
                    toast({
                      title: 'Error fetching logs',
                      description: error.message,
                      variant: 'destructive'
                    });
                    return;
                  }
                  
                  console.log('Recent mapping logs:', data);
                  toast({
                    title: 'Logs retrieved',
                    description: 'Check browser console for log data'
                  });
                }}
              >
                View Recent Logs (Console)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { data, error } = await supabase
                    .from('gl_relationship_mappings')
                    .select('*');
                    
                  if (error) {
                    console.error('Error fetching mappings:', error);
                    toast({
                      title: 'Error fetching mappings',
                      description: error.message,
                      variant: 'destructive'
                    });
                    return;
                  }
                  
                  console.log('Relationship mappings configuration:', data);
                  toast({
                    title: 'Mappings retrieved',
                    description: 'Check browser console for mappings data'
                  });
                }}
              >
                View Mappings Config (Console)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
