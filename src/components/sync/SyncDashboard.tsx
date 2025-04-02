import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SyncOverview } from './overview/SyncOverview';
import { SyncDock } from './SyncDock';
import { useIsMobile } from '@/hooks/use-is-mobile';
import SupabaseTableView from '../data-management/SupabaseTableView';
import { useGlSync } from '@/hooks/useGlSync';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, Loader2, Settings, Database, List, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

export function SyncDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();
  const isMobile = useIsMobile();
  const { syncData, isLoading: isSyncing } = useGlSync();
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [mappings, setMappings] = useState([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(true);
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  
  // Update last sync time from localStorage or set current time on first sync
  useEffect(() => {
    const storedTime = localStorage.getItem(`lastSync_${mappingId}`);
    if (storedTime) {
      setLastSyncTime(storedTime);
    }
  }, [mappingId]);

  const handleSync = async () => {
    if (!mappingId) return;
    
    try {
      // Extract connection ID from mapping ID or use a default
      const connectionId = localStorage.getItem(`connection_${mappingId}`) || 'default';
      
      await syncData(connectionId, mappingId);
      
      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem(`lastSync_${mappingId}`, now);
      setLastSyncTime(now);
      
      toast({
        title: "Sync initiated",
        description: "The sync process has been started successfully.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const formatLastSyncTime = (isoTime: string | null) => {
    if (!isoTime) return 'Never';
    
    const date = new Date(isoTime);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const fetchMappings = async () => {
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
  };

  const fetchTables = async () => {
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
  };

  useEffect(() => {
    fetchMappings();
    fetchTables();
  }, []);

  return (
    <div className="flex flex-col space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sync Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your data synchronization
          </p>
        </div>
        
        {mappingId ? (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/sync')}
              className="h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-9"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>
      
      {/* Last sync time indicator (only when viewing a specific mapping) */}
      {mappingId && (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium">Last Synchronized</h3>
              <p className="text-sm text-muted-foreground">
                {formatLastSyncTime(lastSyncTime)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/sync/settings/${mappingId}`)}
              className="h-8"
            >
              <Settings className="h-4 w-4 mr-2" />
              Mapping Settings
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        {mappingId ? (
          // Specific mapping view
          <motion.div
            key="mapping-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Tabs
              defaultValue="details"
              className="w-full"
              onValueChange={(value) => setActiveTab(value)}
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid grid-cols-3 w-auto">
                  <TabsTrigger value="details" className="flex items-center gap-1.5">
                    <Database className="h-4 w-4" />
                    <span className={cn(isMobile ? "sr-only" : "")}>Table Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex items-center gap-1.5">
                    <List className="h-4 w-4" />
                    <span className={cn(isMobile ? "sr-only" : "")}>Sync Logs</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4" />
                    <span className={cn(isMobile ? "sr-only" : "")}>Analytics</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="details" className="space-y-4">
                <SupabaseTableView 
                  tableName={activeTable || 'gl_invoices'} 
                  displayName="Sync Data"
                  description="View and manage synchronized data"
                  showSyncOptions={true}
                />
              </TabsContent>
              
              <TabsContent value="logs">
                {/* <SyncLogs mappingId={mappingId} /> */}
              </TabsContent>
              
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Sync Analytics</CardTitle>
                    <CardDescription>
                      View performance metrics and sync statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Analytics features coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          // Overview dashboard
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SyncDock activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="mt-6">
              <TabsContent value="overview" className={activeTab === 'overview' ? 'block' : 'hidden'}>
                <SyncOverview />
              </TabsContent>
              
              {/* <TabsContent value="logs" className={activeTab === 'logs' ? 'block' : 'hidden'}>
                <SyncLogs />
              </TabsContent> */}
              
              <TabsContent value="settings" className={activeTab === 'settings' ? 'block' : 'hidden'}>
                <Card>
                  <CardHeader>
                    <CardTitle>Global Sync Settings</CardTitle>
                    <CardDescription>
                      Configure global synchronization settings and defaults
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Global settings features coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
