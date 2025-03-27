
// DEPRECATED: This hook is maintained for backward compatibility.
// Please use useGlSync instead.
import { useGlSync } from './useGlSync';
import { ProductSyncResult } from '@/types/glsync';

interface UseSyncDataResult {
  syncData: (connectionId: string, mappingId: string) => Promise<ProductSyncResult | null>;
  isLoading: boolean;
  error: string | null;
}

export function useSyncData(): UseSyncDataResult {
  // Use the enhanced hook
  const { syncData: enhancedSyncData, isLoading, error } = useGlSync();
  
  // Adapter function that maintains the old API
  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult | null> => {
    // Call the enhanced version
    return enhancedSyncData(connectionId, mappingId);
  };

  return { syncData, isLoading, error };
}
