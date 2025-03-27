
import { supabase } from '@/integrations/supabase/client';
import { 
  GlConnection, 
  GlideTable, 
  MappingToValidate, 
  ColumnMappingSuggestion, 
  ProductSyncResult 
} from '@/types/glsync';

/**
 * API service for Glide Sync related operations
 */
export const glSyncApi = {
  /**
   * Tests a connection to Glide
   */
  async testConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId: connectionId
        }
      });

      if (error) {
        console.error('Error testing connection:', error);
        return { success: false, error: error.message };
      }

      return { success: data?.success || false, error: data?.error };
    } catch (err) {
      console.error('Error calling test connection function:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Lists the tables in a Glide connection
   */
  async listGlideTables(connectionId: string): Promise<{ success: boolean; tables?: GlideTable[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'listGlideTables',
          connectionId: connectionId
        }
      });

      if (error) {
        console.error('Error listing Glide tables:', error);
        return { success: false, error: error.message };
      }

      return { success: true, tables: data?.tables || [] };
    } catch (err) {
      console.error('Error calling list Glide tables function:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Syncs data between Glide and Supabase
   */
  async syncData(connectionId: string, mappingId: string): Promise<ProductSyncResult | null> {
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
  },

  /**
   * Retries a failed sync operation
   */
  async retryFailedSync(connectionId: string, mappingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'retryFailedSync',
          connectionId: connectionId,
          mappingId: mappingId
        }
      });

      if (error) {
        console.error('Error retrying failed sync:', error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error('Error calling retry failed sync function:', err);
      return false;
    }
  },

  /**
   * Gets column mappings for a given table in Glide
   */
  async getColumnMappings(connectionId: string, tableId: string): Promise<ColumnMappingSuggestion[]> {
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
  },

  /**
   * Validates a mapping
   */
  async validateMapping(mapping: MappingToValidate): Promise<boolean> {
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
  },

  /**
   * Maps all relationships across gl tables to link rowid_ columns to sb_ columns
   */
  async mapAllRelationships(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'mapRelationships'
        }
      });

      if (error) {
        console.error('Error mapping relationships:', error);
        return { success: false, error: error.message };
      }

      return { success: data?.success || false, result: data?.result || null };
    } catch (err) {
      console.error('Error calling relationship mapping function:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Gets Supabase table columns
   */
  async getSupabaseTableColumns(tableName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('column_name');

      if (error) {
        console.error('Error fetching table columns:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching table columns:', err);
      return [];
    }
  },

  /**
   * Gets connections
   */
  async getConnections(): Promise<GlConnection[]> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching connections:', err);
      return [];
    }
  },

  /**
   * Adds a connection
   */
  async addConnection(connection: Omit<GlConnection, 'id' | 'created_at'>): Promise<GlConnection> {
    const { data, error } = await supabase
      .from('gl_connections')
      .insert(connection)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating connection: ${error.message}`);
    }

    return data;
  },

  /**
   * Updates a connection
   */
  async updateConnection(id: string, connection: Partial<GlConnection>): Promise<GlConnection> {
    const { data, error } = await supabase
      .from('gl_connections')
      .update(connection)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating connection: ${error.message}`);
    }

    return data;
  },

  /**
   * Deletes a connection
   */
  async deleteConnection(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_connections')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting connection: ${error.message}`);
    }
  }
};
