// src/services/shipping/shipping-record-service.ts
import { supabase } from '@/lib/supabase';

export interface ShippingRecordFilters {
  receiverState?: string;
  // Add more filters as needed
}

export interface ShippingRecord {
  id: string;
  receiverState: string;
  // Add more fields as needed
}

export interface ShippingRecordStats {
  total: number;
}

/**
 * Fetch paginated shipping records with optional filtering by state.
 * @param filters - Filtering options (e.g., receiverState)
 * @param page - Page number (1-based)
 * @param pageSize - Number of records per page
 */
export async function fetchShippingRecords(
  filters: ShippingRecordFilters = {},
  page = 1,
  pageSize = 20
): Promise<{ records: ShippingRecord[]; total: number }> {
  let query = supabase.from('gl_shipping_records').select('*', { count: 'exact' });

  if (filters.receiverState && filters.receiverState !== 'all') {
    query = query.eq('receiver_state', filters.receiverState);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    records: (data as ShippingRecord[]) || [],
    total: count || 0,
  };
}

/**
 * Example usage in a React hook (React Query recommended)
 */
// import { useQuery } from '@tanstack/react-query';
// export function useShippingRecords(filters: ShippingRecordFilters, page: number, pageSize: number) {
//   return useQuery(['shipping-records', filters, page, pageSize], () => fetchShippingRecords(filters, page, pageSize));
// }
