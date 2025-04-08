import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, Settings, List, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useGlSync } from '@/hooks/useGlSync';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { TableName } from '@/hooks/useTableData';
import { SyncDock } from './SyncDock';
import { SyncOverview } from './SyncOverview';
import { MappingsList } from '../mappings/MappingsList';
import { SyncLogsView } from '../mappings/SyncLogsView';
import { SyncErrorsView } from '../mappings/SyncErrorsView';
import { SyncDetailTable } from '../tables/SyncDetailTable';
import { 
  TABLE_INFO, 
  fetchAvailableTables, 
  fetchRecordCount,
  storeLastSyncTime
} from '../utils/syncUtils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Mapping } from '@/types/syncLog';

/**
 * SyncDashboard component provides a comprehensive interface for managing
 * Glide-Supabase synchronization operations
 */
export default function SyncDashboard() {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
  
  // Hooks
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();
  const isMobile = useIsMobile();
  const { syncMappingById, isLoading: isSyncing } = useGlSync();
  const { mappings, isLoading: isMappingsLoading, refreshMappings } = useRealtimeMappings();
  const { toast } = useToast();
  
  // Fetch tables on component mount
  useEffect(() => {
    const loadTables = async () => {
      const tables = await fetchAvailableTables();
      setTables(tables);
    };
    
    loadTables();
  }, []);
  
  // Update record count when active table changes
  useEffect(() => {
    const loadRecordCount = async () => {
      if (activeTable) {
        setIsLoadingCount(true);
        const count = await fetchRecordCount(activeTable as TableName);
        setRecordCount(count);
        setIsLoadingCount(false);
      } else {
        setRecordCount(null);
      }
    };
    
    loadRecordCount();
  }, [activeTable]);
  
  // Reset active table when switching away from tables tab
  useEffect(() => {
    if (activeTab !== 'tables') {
      setActiveTable(null);
    }
  }, [activeTab]);
  
  // Handlers
  const handleSync = async () => {
    if (!mappingId) {
      toast({
        title: "No mapping selected",
        description: "Please select a mapping to sync",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await syncMappingById(mappingId);
      
      // Update last sync time
      storeLastSyncTime(mappingId);
      
      toast({
        title: "Sync completed",
        description: "Data has been synchronized successfully"
      });
      
      // Refresh data
      refreshMappings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  const handleEditMapping = (mapping: Mapping) => {
    setEditingMapping(mapping);
    navigate(`/sync/mappings/edit/${mapping.id}`);
  };
  
  // Render
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Sync Control Dock */}
      <SyncDock
        mappingId={mappingId}
        onSync={handleSync}
        isSyncing={isSyncing}
        className="sticky top-4 z-10"
      />
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTable ? (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            id={`table-${activeTable}`}
            className="mt-8"
          >
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTable(null)}
                className="mr-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tables
              </Button>
              <h2 className="text-2xl font-bold">
                {TABLE_INFO[activeTable]?.displayName || activeTable}
              </h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{TABLE_INFO[activeTable]?.displayName || activeTable}</CardTitle>
                <CardDescription>
                  {TABLE_INFO[activeTable]?.description || 'Table data'}
                  {recordCount !== null && !isLoadingCount && (
                    <span className="ml-2 text-sm">
                      ({recordCount} {recordCount === 1 ? 'record' : 'records'})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SyncDetailTable
                  tableName={activeTable as TableName}
                  displayName={TABLE_INFO[activeTable]?.displayName || activeTable}
                  description={TABLE_INFO[activeTable]?.description}
                  initialFilter={mappingId ? { rowid_mappings: mappingId } : {}}
                  readOnly={false}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    <span className={isMobile ? "sr-only" : ""}>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="mappings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className={isMobile ? "sr-only" : ""}>Mappings</span>
                  </TabsTrigger>
                  <TabsTrigger value="tables" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className={isMobile ? "sr-only" : ""}>Tables</span>
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span className={isMobile ? "sr-only" : ""}>Logs</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sync Overview</CardTitle>
                      <CardDescription>
                        Overview of your data synchronization status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SyncOverview />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="mappings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mappings</CardTitle>
                      <CardDescription>
                        Configure and manage your table mappings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MappingsList onEdit={handleEditMapping} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tables">
                  <Card>
                    <CardHeader>
                      <CardTitle>Table Management</CardTitle>
                      <CardDescription>
                        View and manage synchronized tables
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tables.map(table => (
                          <Card 
                            key={table} 
                            className="cursor-pointer hover:bg-accent/50 transition-colors" 
                            onClick={() => {
                              setActiveTable(table);
                              // Add a small delay to allow animation
                              setTimeout(() => {
                                document.getElementById(`table-${table}`)?.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{TABLE_INFO[table]?.displayName || table}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {TABLE_INFO[table]?.description || 'Synchronized table data'}
                              </p>
                              <div className="mt-2 flex justify-end">
                                <Button variant="ghost" size="sm">
                                  <Database className="mr-2 h-4 w-4" />
                                  View Data
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="logs">
                  <Tabs defaultValue="errors">
                    <TabsList>
                      <TabsTrigger value="errors">Errors</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="errors">
                      <Card>
                        <CardHeader>
                          <CardTitle>Sync Errors</CardTitle>
                          <CardDescription>
                            View errors encountered during sync operations
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {mappingId ? (
                            <SyncErrorsView mappingId={mappingId} />
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              Select a mapping to view its errors
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="activity">
                      <Card>
                        <CardHeader>
                          <CardTitle>Sync Logs</CardTitle>
                          <CardDescription>
                            View detailed sync operation logs
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {mappingId ? (
                            <SyncLogsView mappingId={mappingId} />
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              Select a mapping to view its logs
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
