import { supabase } from '@/integrations/supabase/client';
import { TableName } from '@/hooks/useTableData';
import { Mapping } from '@/types/syncLog';

/**
 * Format last sync time into a human-readable string
 * 
 * @param isoTime ISO timestamp string or null
 * @returns Formatted time string (e.g., "Just now", "5 minutes ago", "2 days ago")
 */
export function formatLastSyncTime(isoTime: string | null): string {
  if (!isoTime) return 'Never';
  
  const date = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Fetch record count for a specific table
 * 
 * @param tableName The table to count records from
 * @returns Promise resolving to the record count or null on error
 */
export async function fetchRecordCount(tableName: TableName): Promise<number | null> {
  if (!tableName) return null;
  
  try {
    const { count, error } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return count;
  } catch (err) {
    console.error(`Error fetching record count for ${tableName}:`, err);
    return null;
  }
}

/**
 * Table metadata for display purposes
 */
export const TABLE_INFO: Record<string, { displayName: string; description: string }> = {
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
 * Get all available tables from the database
 * 
 * @returns Promise resolving to an array of table names
 */
export async function fetchAvailableTables(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('gl_mappings')
      .select('supabase_table')
      .eq('enabled', true);
    
    if (error) throw error;
    
    // Extract unique table names
    const tables = [...new Set(data.map(item => item.supabase_table))];
    return tables;
  } catch (err) {
    console.error('Error fetching tables:', err);
    return [];
  }
}

/**
 * Store last sync time in localStorage
 * 
 * @param mappingId The mapping ID to store time for
 * @param time ISO timestamp string or current time if not provided
 */
export function storeLastSyncTime(mappingId: string | undefined, time?: string): void {
  if (!mappingId) return;
  
  try {
    const timestamp = time || new Date().toISOString();
    localStorage.setItem(`lastSync_${mappingId}`, timestamp);
  } catch (err) {
    console.error("Error storing sync time:", err);
  }
}

/**
 * Get last sync time from localStorage
 * 
 * @param mappingId The mapping ID to get time for
 * @returns ISO timestamp string or null if not found
 */
export function getLastSyncTime(mappingId: string | undefined): string | null {
  if (!mappingId) return null;
  
  try {
    return localStorage.getItem(`lastSync_${mappingId}`);
  } catch (err) {
    console.error("Error accessing localStorage:", err);
    return null;
  }
}

/**
 * Creates a detailed sync log entry with field-level information
 * 
 * @param mappingId - The ID of the mapping being synced
 * @param status - The status of the sync operation ('started', 'completed', 'failed')
 * @param data - Additional data about the sync operation
 * @returns Promise resolving to the created log entry
 */
export async function createDetailedSyncLog(
  mappingId: string,
  status: 'started' | 'completed' | 'failed',
  data: {
    message?: string;
    recordsProcessed?: number;
    syncedFields?: string[];
    errorDetails?: any;
    syncDuration?: number;
    recordDetails?: {
      table: string;
      inserted?: number;
      updated?: number;
      failed?: number;
      sampleData?: any;
    };
  }
): Promise<any> {
  try {
    // Create a structured log message with field details
    const detailedMessage = JSON.stringify({
      message: data.message || '',
      syncedFields: data.syncedFields || [],
      errorDetails: data.errorDetails || null,
      recordDetails: data.recordDetails || null,
      syncDuration: data.syncDuration || null
    });

    // Insert the log entry
    const { data: logEntry, error } = await supabase
      .from('gl_sync_logs')
      .insert({
        mapping_id: mappingId,
        status,
        message: data.message || '',
        records_processed: data.recordsProcessed || 0,
        started_at: new Date().toISOString(),
        completed_at: status !== 'started' ? new Date().toISOString() : null,
        details: detailedMessage // Store the detailed JSON in a details column
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sync log:', error);
      return null;
    }

    return logEntry;
  } catch (err) {
    console.error('Error in createDetailedSyncLog:', err);
    return null;
  }
}
