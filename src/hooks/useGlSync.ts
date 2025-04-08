import { useState } from 'react';
import { useConnectionTesting } from './useConnectionTesting';
import { useGlideTables } from './useGlideTables';
import { useSyncOperations } from './useSyncOperations';
import { useRelationshipMapping } from './useRelationshipMapping';
import { createLogger } from '@/utils/logger';
import { glSyncService } from '@/services/glsync';

// Create a dedicated logger for the GlSync hook
const logger = createLogger('GlSync');

/**
 * Main hook for Glide synchronization functionality.
 * This acts as a facade combining more specialized hooks for a unified API.
 * 
 * @returns An object containing all Glide sync related operations and state
 */
export function useGlSync() {
  const [error, setError] = useState<string | null>(null);
  
  // Use specialized hooks
  const connectionTesting = useConnectionTesting();
  const glideTables = useGlideTables();
  const syncOperations = useSyncOperations();
  const relationshipMapping = useRelationshipMapping();

  // Determine overall loading state
  const isLoading = 
    connectionTesting.isLoading || 
    glideTables.isLoading || 
    syncOperations.isLoading;
    
  logger.debug('useGlSync hook initialized');

  return {
    // Connection testing
    testConnection: connectionTesting.testConnection,
    
    // Table operations
    listTables: glideTables.fetchGlideTables,
    glideTables: glideTables.glideTables,
    fetchGlideTables: glideTables.fetchGlideTables,
    
    // Sync operations - the main functionality
    syncData: syncOperations.syncData,
    syncMappingById: syncOperations.syncMappingById,
    retryFailedSync: syncOperations.retryFailedSync,
    batchSyncMappings: syncOperations.batchSyncMappings,
    
    // Relationship mapping
    mapAllRelationships: relationshipMapping.mapRelationships,
    checkRelationshipStatus: relationshipMapping.checkRelationshipStatus,
    relationshipStatus: relationshipMapping.relationshipStatus,
    
    // Direct service access for advanced operations
    service: glSyncService,
    
    // Status indicators
    isLoading,
    progress: syncOperations.progress,
    isRelationshipMapping: relationshipMapping.isLoading,
    error: error || connectionTesting.error || glideTables.error || 
           syncOperations.error || relationshipMapping.error
  };
}
