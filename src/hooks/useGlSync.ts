
import { useState } from 'react';
import { useConnectionTesting } from './useConnectionTesting';
import { useGlideTables } from './useGlideTables';
import { useSyncOperations } from './useSyncOperations';
import { useRelationshipMapping } from './useRelationshipMapping';

/**
 * Main hook for Glide synchronization functionality.
 * This acts as a facade combining more specialized hooks.
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

  return {
    // Connection testing
    testConnection: connectionTesting.testConnection,
    
    // Table operations
    listTables: glideTables.fetchGlideTables,
    glideTables: glideTables.glideTables,
    fetchGlideTables: glideTables.fetchGlideTables,
    
    // Sync operations
    syncData: syncOperations.syncData,
    syncMappingById: syncOperations.syncMappingById,
    retryFailedSync: syncOperations.retryFailedSync,
    
    // Relationship mapping
    mapAllRelationships: relationshipMapping.mapRelationships,
    checkRelationshipStatus: relationshipMapping.checkRelationshipStatus,
    relationshipStatus: relationshipMapping.relationshipStatus,
    
    // Status indicators
    isLoading,
    isRelationshipMapping: relationshipMapping.isLoading,
    error: error || connectionTesting.error || glideTables.error || 
           syncOperations.error || relationshipMapping.error
  };
}
