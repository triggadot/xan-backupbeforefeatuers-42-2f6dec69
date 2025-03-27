import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';

const SyncOverview = () => {
  const { allSyncStatuses, isLoading } = useGlSyncStatus();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const isMobile = useIsMobile();

  const { totalMappings, enabledMappings, disabledMappings, activeMappings, hasErrors } = useMemo(() => ({
    totalMappings: allSyncStatuses?.length || 0,
    enabledMappings: allSyncStatuses?.filter(status => status.enabled).length || 0,
    disabledMappings: allSyncStatuses?.filter(status => !status.enabled).length || 0,
    activeMappings: allSyncStatuses?.filter(status => status.current_status === 'processing').length || 0,
    hasErrors: allSyncStatuses?.filter(status => status.error_count && status.error_count > 0).length || 0,
  }), [allSyncStatuses]);

  const debouncedNavigate = useMemo(
    () => debounce((path: string) => navigate(path), 300),
    [navigate]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Sync Overview</CardTitle>
        <CardDescription>
          Status of all table mappings between Glide and Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <motion.div 
            className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-sm text-muted-foreground">Total Mappings</span>
            <span className="text-2xl font-semibold">{totalMappings}</span>
          </motion.div>

          <motion.div 
            className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm text-muted-foreground">Enabled</span>
            <span className="text-2xl font-semibold">{enabledMappings}</span>
          </motion.div>

          <motion.div 
            className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-sm text-muted-foreground">Disabled</span>
            <span className="text-2xl font-semibold">{disabledMappings}</span>
          </motion.div>

          <motion.div 
            className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-sm text-muted-foreground">With Errors</span>
            <span className="text-2xl font-semibold">{hasErrors}</span>
          </motion.div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`mb-4 ${isMobile ? 'w-full grid grid-cols-4' : ''}`}>
            <TabsTrigger value="all" className={isMobile ? 'text-xs py-1.5' : ''}>All</TabsTrigger>
            <TabsTrigger value="enabled" className={isMobile ? 'text-xs py-1.5' : ''}>Enabled</TabsTrigger>
            <TabsTrigger value="active" className={isMobile ? 'text-xs py-1.5' : ''}>Active</TabsTrigger>
            <TabsTrigger value="errors" className={isMobile ? 'text-xs py-1.5' : ''}>Errors</TabsTrigger>
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
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {allSyncStatuses.map((status, index) => (
                  <motion.div 
                    key={status.mapping_id}
                    variants={itemVariants}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-all touch-manipulation"
                    onClick={() => debouncedNavigate(`/sync/mappings/${status.mapping_id}`)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-medium truncate max-w-[200px] sm:max-w-none">
                          {status.glide_table_display_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {status.app_name} → {status.supabase_table}
                        </p>
                      </div>
                      <SyncStatusBadge status={status.current_status || 'idle'} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
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
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {allSyncStatuses
                  .filter(status => status.enabled)
                  .map((status) => (
                    <motion.div 
                      key={status.mapping_id}
                      variants={itemVariants}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-all touch-manipulation"
                      onClick={() => debouncedNavigate(`/sync/mappings/${status.mapping_id}`)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-medium truncate max-w-[200px] sm:max-w-none">
                            {status.glide_table_display_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {status.app_name} → {status.supabase_table}
                          </p>
                        </div>
                        <SyncStatusBadge status={status.current_status || 'idle'} />
                      </div>
                    </motion.div>
                ))}
              </motion.div>
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
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {allSyncStatuses
                  .filter(status => status.current_status === 'processing')
                  .map((status) => (
                    <motion.div 
                      key={status.mapping_id}
                      variants={itemVariants}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-all touch-manipulation"
                      onClick={() => debouncedNavigate(`/sync/mappings/${status.mapping_id}`)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
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
                    </motion.div>
                ))}
              </motion.div>
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
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {allSyncStatuses
                  .filter(status => status.error_count && status.error_count > 0)
                  .map((status) => (
                    <motion.div 
                      key={status.mapping_id}
                      variants={itemVariants}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-all touch-manipulation"
                      onClick={() => debouncedNavigate(`/sync/mappings/${status.mapping_id}`)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
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
                    </motion.div>
                ))}
              </motion.div>
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
