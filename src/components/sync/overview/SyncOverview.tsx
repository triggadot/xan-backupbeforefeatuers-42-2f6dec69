
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SyncStatusBadge from '../ui/SyncStatusBadge';
import { GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';

const SyncOverview = () => {
  const { allSyncStatuses, isLoading } = useGlSyncStatus();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  // Compute stats based on sync statuses
  const totalMappings = allSyncStatuses?.length || 0;
  const enabledMappings = allSyncStatuses?.filter(status => status.enabled).length || 0;
  const disabledMappings = allSyncStatuses?.filter(status => !status.enabled).length || 0;
  const activeMappings = allSyncStatuses?.filter(status => status.current_status === 'processing').length || 0;
  const hasErrors = allSyncStatuses?.filter(status => status.error_count && status.error_count > 0).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Overview</CardTitle>
        <CardDescription>
          Status of all table mappings between Glide and Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Mappings</span>
            <span className="text-2xl font-semibold">{totalMappings}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Enabled</span>
            <span className="text-2xl font-semibold">{enabledMappings}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Disabled</span>
            <span className="text-2xl font-semibold">{disabledMappings}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">With Errors</span>
            <span className="text-2xl font-semibold">{hasErrors}</span>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="enabled">Enabled</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse p-3 border rounded-lg">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : allSyncStatuses && allSyncStatuses.length > 0 ? (
              <div className="space-y-3">
                {allSyncStatuses.map((status) => (
                  <div 
                    key={status.mapping_id} 
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => navigate(`/sync/mappings/${status.mapping_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{status.glide_table_display_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {status.app_name} → {status.supabase_table}
                        </p>
                      </div>
                      <SyncStatusBadge status={status.current_status || 'idle'} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No mappings found.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="enabled">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse p-3 border rounded-lg">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : allSyncStatuses && allSyncStatuses.filter(s => s.enabled).length > 0 ? (
              <div className="space-y-3">
                {allSyncStatuses
                  .filter(status => status.enabled)
                  .map((status) => (
                    <div 
                      key={status.mapping_id} 
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/sync/mappings/${status.mapping_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{status.glide_table_display_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {status.app_name} → {status.supabase_table}
                          </p>
                        </div>
                        <SyncStatusBadge status={status.current_status || 'idle'} />
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No enabled mappings found.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse p-3 border rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ) : allSyncStatuses && allSyncStatuses.filter(s => s.current_status === 'processing').length > 0 ? (
              <div className="space-y-3">
                {allSyncStatuses
                  .filter(status => status.current_status === 'processing')
                  .map((status) => (
                    <div 
                      key={status.mapping_id} 
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/sync/mappings/${status.mapping_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{status.glide_table_display_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {status.app_name} → {status.supabase_table}
                          </p>
                        </div>
                        <SyncStatusBadge status="processing" />
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No active syncs running.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="errors">
            {isLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse p-3 border rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ) : allSyncStatuses && allSyncStatuses.filter(s => s.error_count && s.error_count > 0).length > 0 ? (
              <div className="space-y-3">
                {allSyncStatuses
                  .filter(status => status.error_count && status.error_count > 0)
                  .map((status) => (
                    <div 
                      key={status.mapping_id} 
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/sync/mappings/${status.mapping_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{status.glide_table_display_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {status.app_name} → {status.supabase_table}
                            <span className="ml-2 text-destructive">
                              {status.error_count} error(s)
                            </span>
                          </p>
                        </div>
                        <SyncStatusBadge status="error" />
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No mappings with errors.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SyncOverview;
