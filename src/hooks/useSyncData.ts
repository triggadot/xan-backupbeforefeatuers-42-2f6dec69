// DEPRECATED: This hook is maintained for backward compatibility.
// Please use useGlSync instead.
import { useGlSync } from './useGlSync';
import { ProductSyncResult } from '@/types/glsync';

interface UseSyncDataResult {
  syncData: (connectionId: string, mappingId: string) => Promise<ProductSyncResult>;
  isLoading: boolean;
  error: string | null;
}

export function useSyncData(): UseSyncDataResult {
  // Use the enhanced hook
  const { syncData: enhancedSyncData, isLoading, error } = useGlSync();
  
  // Adapter function that maintains the old API
  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    // Use the useDirect=false option to use the Supabase function call directly
    // This matches the original useSyncData implementation
    return enhancedSyncData(connectionId, mappingId, false);
  };

  return { syncData, isLoading, error };
}
