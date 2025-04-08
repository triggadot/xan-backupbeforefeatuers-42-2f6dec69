import { supabase } from '@/integrations/supabase/client';
import { GlConnection, GlideTable, MappingToValidate, ColumnMappingSuggestion, ProductSyncResult, SyncRequestPayload } from '@/types/glsync';
import { asTable } from '@/types/supabase';

/**
 * Tests the connection to Glide
 * @param connectionId The ID of the connection to test
 * @returns A promise that resolves to a boolean indicating whether the connection was successful
 */
export const testConnection = async (connectionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'testConnection',
        connectionId: connectionId
      }
    });

    if (error) {
      console.error('Error testing connection:', error);
      return false;
    }

    return data?.success || false;
  } catch (err) {
    console.error('Error calling test connection function:', err);
    return false;
  }
};

/**
 * Lists the tables in Glide
 * @param connectionId The ID of the connection to list tables for
 * @returns A promise that resolves to an array of Glide tables
 */
export const listGlideTables = async (connectionId: string): Promise<GlideTable[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'listGlideTables',
        connectionId: connectionId
      }
    });

    if (error) {
      console.error('Error listing Glide tables:', error);
      return [];
    }

    return data?.tables || [];
  } catch (err) {
    console.error('Error calling list Glide tables function:', err);
    return [];
  }
};

/**
 * Syncs data between Glide and Supabase
 * @param connectionId The ID of the connection to sync data for
 * @param mappingId The ID of the mapping to use for syncing
 * @returns A promise that resolves to a boolean indicating whether the sync was successful
 */
export const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'syncData',
        connectionId: connectionId,
        mappingId: mappingId
      }
    });

    if (error) {
      console.error('Error syncing data:', error);
      return null;
    }

    return data as ProductSyncResult || null;
  } catch (err) {
    console.error('Error calling sync data function:', err);
    return null;
  }
};

/**
 * Gets column mappings for a given table in Glide
 * @param connectionId The ID of the connection to get column mappings for
 * @param tableId The ID of the table to get column mappings for
 * @returns A promise that resolves to an array of column mappings
 */
export const getColumnMappings = async (connectionId: string, tableId: string): Promise<ColumnMappingSuggestion[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'getColumnMappings',
        connectionId: connectionId,
        tableId: tableId
      }
    });

    if (error) {
      console.error('Error getting column mappings:', error);
      return [];
    }

    return data?.columnMappings || [];
  } catch (err) {
    console.error('Error calling get column mappings function:', err);
    return [];
  }
};

/**
 * Validates a mapping
 * @param mapping The mapping to validate
 * @returns A promise that resolves to a boolean indicating whether the mapping is valid
 */
export const validateMapping = async (mapping: MappingToValidate): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'validateMapping',
        mapping: mapping
      }
    });

    if (error) {
      console.error('Error validating mapping:', error);
      return false;
    }

    return data?.isValid || false;
  } catch (err) {
    console.error('Error calling validate mapping function:', err);
    return false;
  }
};

/**
 * Maps all relationships across gl tables to link rowid_ columns to sb_ columns
 * @param options Optional parameters for relationship mapping
 * @returns A promise that resolves to a mapping result object
 */
export const mapAllRelationships = async (options?: {
  retryCount?: number;
  tableFilter?: string;
}): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> => {
  try {
    // First check if there are any valid mappings to process
    const { data: validationData, error: validationError } = await supabase
      .from('gl_relationship_mapping_log')
      .select('count')
      .eq('status', 'pending');
    
    if (validationError) {
      console.error('Error validating pending relationships:', validationError);
      return { success: false, error: validationError.message };
    }

    const pendingCount = validationData?.[0]?.count ?? 0;
    console.log('Found pending relationships:', pendingCount);
    
    // Call the SQL function to map all relationships
    const { data, error } = await supabase.rpc('map_all_sb_relationships', {
      p_table_filter: options?.tableFilter || null
    });

    if (error) {
      console.error('Error mapping relationships:', error);
      return { success: false, error: error.message };
    }

    console.log('Relationship mapping result:', data);
    return { success: true, result: data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error calling relationship mapping function:', err);
    return { success: false, error: errorMessage };
  }
};

/**
 * Validates relationships to ensure data exists before mapping
 * @returns A promise that resolves to a validation result object
 */
export const validateRelationships = async (): Promise<{
  success: boolean;
  validTables: string[];
  error?: string;
}> => {
  try {
    // Get a list of tables with pending relationships
    const { data, error } = await supabase
      .from('gl_relationship_mappings')
      .select('supabase_table, target_table')
      .eq('enabled', true);
    
    if (error) {
      console.error('Error fetching relationship mappings:', error);
      return { success: false, validTables: [], error: error.message };
    }

    const tables = [...new Set([
      ...(data?.map(d => d.supabase_table) || []),
      ...(data?.map(d => d.target_table) || [])
    ])];

    // Check if tables have data
    const validTables: string[] = [];
    
    for (const table of tables) {
      try {
        // Direct table query without type assertion
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!countError && (count || 0) > 0) {
          validTables.push(table);
        }
      } catch (e) {
        console.warn(`Could not check table ${table}: `, e);
        // Continue with other tables
      }
    }

    return { 
      success: true, 
      validTables 
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error validating relationships:', err);
    return { success: false, validTables: [], error: errorMessage };
  }
};
