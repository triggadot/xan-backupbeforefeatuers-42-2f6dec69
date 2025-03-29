import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw, AlertTriangle, Database, FileText, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import SyncMetricsCard from './overview/SyncMetricsCard';
import { SyncStats } from './overview/SyncStats';
import { RecentSyncList } from './overview/RecentSyncList';
import { RecentActivity } from './overview/RecentActivity';
import { ActiveMappingCard } from './overview/ActiveMappingCard';
import { supabase } from '@/integrations/supabase/client';
import SupabaseTableView from '@/components/data-management/SupabaseTableView';
import { SyncDock } from './SyncDock';
import { motion, AnimatePresence } from 'framer-motion';

// Define table display names and descriptions
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

const SyncDashboard = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState("overview");
  const [mappings, setMappings] = useState([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(true);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  
  // Hooks
  const { syncData, isLoading: glSyncLoading } = useGlSync();
  const { toast } = useToast();
  const { 
    syncStats, 
    recentLogs,
    allSyncStatuses,
    isLoading: statusLoading, 
    hasError,
    errorMessage,
    refreshData
  } = useGlSyncStatus();

  // Event handlers and callbacks
  const fetchMappings = useCallback(async () => {
    setIsLoadingMappings(true);
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: 'Error fetching mappings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMappings(false);
    }
  }, [toast]);

  const fetchTables = useCallback(async () => {
    try {
      // Get all gl_ tables that are relevant for our application
      const glTables = Object.keys(TABLE_INFO).filter(table => table.startsWith('gl_'));
      
      // Set the tables
      setTables(glTables);
      
      // Set first table as active if none is selected
      if (glTables.length > 0 && !activeTable) {
        setActiveTable(glTables[0]);
      }
    } catch (error) {
      console.error('Error setting up tables:', error);
      toast({
        title: 'Error setting up tables',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [toast, activeTable]);

  const handleSync = async (connectionId: string, mappingId: string) => {
    setIsSyncing(prev => ({ ...prev, [mappingId]: true }));
    
    try {
      const result = await syncData(connectionId, mappingId);
      
      if (result) {
        toast({
          title: 'Sync started',
          description: 'The synchronization process has been initiated.',
        });
        
        // Refresh data after a short delay to allow sync to start
        setTimeout(() => {
          fetchMappings();
          refreshData();
        }, 2000);
      } else {
        toast({
          title: 'Sync failed',
          description: 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [mappingId]: false }));
    }
  };

  const refreshAll = () => {
    fetchMappings();
    fetchTables();
    refreshData();
  };

  // Effects
  useEffect(() => {
    fetchMappings();
    fetchTables();
    refreshData();
    
    // Set up realtime subscription for mappings
    const mappingsChannel = supabase
      .channel('gl_mappings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => {
          fetchMappings();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(mappingsChannel);
    };
  }, [fetchMappings, fetchTables, refreshData]);

  // Render helpers
  const renderError = () => (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-medium">Unable to load synchronization dashboard</h3>
            <p className="text-muted-foreground">
              {errorMessage || 'There was an error connecting to the database. Please ensure the database tables have been created.'}
            </p>
            <Button onClick={refreshAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMappingsContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active Mappings</h3>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoadingMappings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : mappings.length === 0 ? (
        <Card className="p-6 text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">No active mappings found.</p>
          <p className="mt-2">
            Create a connection and set up table mappings to start synchronizing data.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mappings
            .filter(status => status.enabled)
            .map((status) => (
              <div key={status.mapping_id} className="col-span-1">
                <ActiveMappingCard 
                  status={status} 
                  onSync={handleSync} 
                  isSyncing={isSyncing[status.mapping_id] || false} 
                />
              </div>
            ))}
        </div>
      )}
    </>
  );

  const renderRecentActivityContent = () => (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Recent sync operations and system activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  );

  const renderSyncLogsContent = () => (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Sync Logs
          </CardTitle>
          <CardDescription>
            Detailed logs of recent synchronization operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentSyncList />
        </CardContent>
      </Card>
    </div>
  );

  const renderTableContent = () => (
    <div className="space-y-6">
      {tables.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Tables Found</CardTitle>
            <CardDescription>
              No database tables were found in your mappings.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tables.map(tableName => (
                <Button
                  key={tableName}
                  variant={activeTable === tableName ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTable(tableName)}
                  className="whitespace-nowrap"
                >
                  {TABLE_INFO[tableName]?.displayName || tableName}
                </Button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTable}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTable && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {TABLE_INFO[activeTable]?.displayName || activeTable}
                    </CardTitle>
                    <CardDescription>
                      {TABLE_INFO[activeTable]?.description || 'Table data'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <SupabaseTableView 
                      tableName={activeTable}
                      displayName={TABLE_INFO[activeTable]?.displayName || activeTable}
                      description={TABLE_INFO[activeTable]?.description || ''}
                    />
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure synchronization settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Settings functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Return/render component
  if (hasError) {
    return renderError();
  }

  return (
    <Card className="shadow-lg border-0 w-full max-w-full overflow-hidden">
      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl sm:text-2xl font-bold">Sync Dashboard</CardTitle>
          <Button 
            variant="outline" 
            onClick={refreshAll}
            disabled={statusLoading}
            className="w-full sm:w-auto"
          >
            {statusLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {statusLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <SyncDock activeTab={activeTab} onTabChange={setActiveTab} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-[400px]"
          >
            {activeTab === "overview" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="shadow-md">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle>Sync Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <SyncStats />
                    </CardContent>
                  </Card>
                  <Card className="shadow-md">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle>Sync Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <SyncMetricsCard syncStats={syncStats || []} isLoading={statusLoading} />
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="shadow-md">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <RecentActivity />
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "mappings" && (
              <Card className="shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle>Active Mappings</CardTitle>
                  <CardDescription>
                    View and manage your active data synchronization mappings
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {renderMappingsContent()}
                </CardContent>
              </Card>
            )}
            
            {activeTab === "tables" && renderTableContent()}
            
            {activeTab === "activity" && renderRecentActivityContent()}
            
            {activeTab === "logs" && renderSyncLogsContent()}
            
            {activeTab === "settings" && renderSettingsContent()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default SyncDashboard;
