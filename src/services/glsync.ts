import { supabase } from '@/integrations/supabase/client';
import { GlConnection, GlideTable, MappingToValidate, ColumnMappingSuggestion, ProductSyncResult, SyncRequestPayload } from '@/types/glsync';

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
 * @returns A promise that resolves to a success flag
 */
export const mapAllRelationships = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('map_all_sb_relationships');

    if (error) {
      console.error('Error mapping relationships:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error calling relationship mapping function:', err);
    return false;
  }
};
