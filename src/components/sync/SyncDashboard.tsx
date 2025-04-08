import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Database, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { SyncOverview } from './overview/SyncOverview';
import { SyncDock } from './SyncDock';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useGlSync } from '@/hooks/useGlSync';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { MappingsList } from './mappings/MappingsList';
import { SyncLogsView } from './mappings/SyncLogsView';
import { SyncErrorsView } from './mappings/SyncErrorsView';
import { Settings, List, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { AnimatePresence } from 'framer-motion';
import { SyncDetailTable } from './SyncDetailTable';
import { TableName } from '@/hooks/useTableData';

// Table metadata for display purposes
const TABLE_INFO: Record<string, { displayName: string; description: string }> = {
  gl_accounts: {
    displayName: 'Accounts',
    description: 'Customer and vendor accounts information'
  },
  gl_invoices: {
    displayName: 'Invoices',
    description: 'Customer invoices and orders'
  },
  gl_invoice_lines: {
    displayName: 'Invoice Line Items',
    description: 'Individual line items on invoices'
  },
  gl_products: {
    displayName: 'Products',
    description: 'Product catalog and inventory'
  },
  gl_purchase_orders: {
    displayName: 'Purchase Orders',
    description: 'Orders made to vendors'
  },
  gl_estimates: {
    displayName: 'Estimates',
    description: 'Customer estimates and quotes'
  },
  gl_estimate_lines: {
    displayName: 'Estimate Line Items',
    description: 'Individual line items on estimates'
  },
  gl_customer_payments: {
    displayName: 'Customer Payments',
    description: 'Payments received from customers'
  },
  gl_vendor_payments: {
    displayName: 'Vendor Payments',
    description: 'Payments made to vendors'
  },
  gl_expenses: {
    displayName: 'Expenses',
    description: 'Business expenses and transactions'
  },
  gl_shipping_records: {
    displayName: 'Shipping Records',
    description: 'Shipping and delivery information'
  },
  gl_mappings: {
    displayName: 'Glide Mappings',
    description: 'Table mapping configurations for Glide sync'
  }
};

/**
 * SyncDashboard component provides a comprehensive interface for managing
 * Glide-Supabase synchronization operations
 */
export default function SyncDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();
  const isMobile = useIsMobile();
  const { syncMappingById, isLoading: isSyncing } = useGlSync();
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update last sync time from localStorage or set current time on first sync
  useEffect(() => {
    try {
      const storedTime = localStorage.getItem(`lastSync_${mappingId}`);
      if (storedTime) {
        setLastSyncTime(storedTime);
      }
    } catch (err) {
      console.error("Error accessing localStorage:", err);
    }
  }, [mappingId]);

  useEffect(() => {
    fetchTables();
  }, []);

  // Reset active table when switching away from tables tab
  useEffect(() => {
    if (activeTab !== 'tables') {
      setActiveTable(null);
    }
  }, [activeTab]);

  /**
   * Initiates the sync process for the current mapping
   */
  const handleSync = async () => {
    if (!mappingId) return;
    
    try {
      // Use syncMappingById for consistency with MappingDetails component
      const success = await syncMappingById(mappingId);
      
      if (!success) {
        throw new Error('Sync operation failed');
      }
      
      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem(`lastSync_${mappingId}`, now);
      setLastSyncTime(now);
      
      toast({
        title: "Sync initiated",
        description: "The sync process has been started successfully.",
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  /**
   * Formats the ISO timestamp into a human-readable format
   */
  const formatLastSyncTime = (isoTime: string | null) => {
    if (!isoTime) return 'Never';
    
    try {
      const date = new Date(isoTime);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (err) {
      console.error("Error formatting date:", err);
      return 'Invalid date';
    }
  };

  /**
   * Fetches all available tables from the database
   */
  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('supabase_table')
        .eq('enabled', true);
      
      if (error) throw error;
      
      // Extract unique table names
      const uniqueTables = [...new Set(data.map(item => item.supabase_table))];
      setTables(uniqueTables);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  /**
   * Fetches the record count for the active table
   */
  const fetchRecordCount = useCallback(async (tableName: string) => {
    if (!tableName) return;
    
    setIsLoadingCount(true);
    try {
      const { count, error } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      setRecordCount(count);
    } catch (err) {
      console.error(`Error fetching record count for ${tableName}:`, err);
      setRecordCount(null);
    } finally {
      setIsLoadingCount(false);
    }
  }, []);

  // Fetch record count when active table changes
  useEffect(() => {
    if (activeTable) {
      fetchRecordCount(activeTable);
    } else {
      setRecordCount(null);
    }
  }, [activeTable, fetchRecordCount]);

  // Handler for editing a mapping
  const handleEditMapping = (mapping) => {
    navigate(`/sync/mappings/edit/${mapping.id}`);
  };

  return (
    <div className="container mx-auto py-6">
      {/* Back button when viewing a specific table */}
      {activeTable && (
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => {
            setActiveTable(null);
            setActiveTab('tables');
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tables
        </Button>
      )}

      <AnimatePresence mode="wait">
        {/* Table detail view */}
        {activeTable ? (
          <motion.div
            key="table-detail"
            id={`table-${activeTable}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {TABLE_INFO[activeTable]?.displayName || activeTable}
                </h2>
                <p className="text-muted-foreground">
                  {TABLE_INFO[activeTable]?.description || 'Table data from Glide'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 mb-4 grid-cols-1 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Synchronized</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lastSyncTime ? formatLastSyncTime(lastSyncTime) : 'Never'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" id="record-count">
                    {isLoadingCount ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      recordCount
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-2 ${lastSyncTime ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="font-medium">{lastSyncTime ? 'Synced' : 'Not Synced'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Table Data</CardTitle>
                <CardDescription>
                  Viewing data for {activeTable}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back button */}
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate('/sync')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sync Dashboard
            </Button>

            <SyncDock activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="overview">
                  <SyncOverview />
                </TabsContent>
                
                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Global Sync Settings</CardTitle>
                      <CardDescription>
                        Configure global synchronization settings and defaults
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Sync Frequency</h3>
                          <div className="flex items-center space-x-2">
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                              <option value="manual">Manual only</option>
                              <option value="hourly">Hourly</option>
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                            </select>
                            <Button variant="outline">Save</Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Batch Size</h3>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="number" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                              defaultValue="100"
                              min="10"
                              max="1000"
                            />
                            <Button variant="outline">Save</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="mappings">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Sync Mappings</CardTitle>
                        <CardDescription>
                          Manage table mappings between Glide and Supabase
                        </CardDescription>
                      </div>
                      <Button onClick={fetchTables} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
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
                
                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sync Activity</CardTitle>
                      <CardDescription>
                        View recent sync activity and status
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
                
                <TabsContent value="logs">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
