
import { supabase } from '@/integrations/supabase/client';
import { GlConnection, GlMapping } from '@/types/glsync';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';
import { SyncError } from '@/types/syncLog';

export const glSyncApi = {
  /**
   * List all connections
   */
  async listConnections() {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, connections: data as GlConnection[] };
    } catch (error) {
      console.error('Error listing connections:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Get a connection by ID
   */
  async getConnectionById(id: string) {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { success: true, connection: data as GlConnection };
    } catch (error) {
      console.error('Error getting connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Create a new connection
   */
  async createConnection(connection: Omit<GlConnection, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .insert(connection)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, connection: data as GlConnection };
    } catch (error) {
      console.error('Error creating connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Update an existing connection
   */
  async updateConnection(id: string, connection: Partial<GlConnection>) {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .update(connection)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, connection: data as GlConnection };
    } catch (error) {
      console.error('Error updating connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Delete a connection
   */
  async deleteConnection(id: string) {
    try {
      const { error } = await supabase
        .from('gl_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Test a connection to Glide
   */
  async testConnection(connection: { app_id: string, api_key: string }) {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connection
        }
      });
      
      if (error) throw error;
      
      return { success: true, result: data };
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * List Glide tables for a connection
   */
  async listGlideTables(connectionId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'listTables',
          connectionId
        }
      });
      
      if (error) throw error;
      
      return { success: true, tables: data.tables };
    } catch (error) {
      console.error('Error listing Glide tables:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Get Glide table columns for a table
   */
  async getGlideTableColumns(connectionId: string, tableId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'getTableColumns',
          connectionId,
          tableId
        }
      });
      
      if (error) throw error;
      
      return { success: true, columns: data.columns };
    } catch (error) {
      console.error('Error getting Glide table columns:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * List mappings
   */
  async listMappings(connectionId?: string) {
    try {
      let query = supabase
        .from('gl_mapping_status')
        .select('*');
      
      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert to GlMapping format
      const mappings = (data || []).map(item => convertToGlMapping(item));
      
      return { success: true, mappings };
    } catch (error) {
      console.error('Error listing mappings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Get a mapping by ID
   */
  async getMappingById(id: string) {
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Convert to GlMapping format
      const mapping = convertToGlMapping(data);
      
      return { success: true, mapping };
    } catch (error) {
      console.error('Error getting mapping:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Create a new mapping
   */
  async createMapping(mapping: Omit<GlMapping, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Convert column_mappings to string if needed for DB
      const dbMapping = {
        ...mapping,
        column_mappings: typeof mapping.column_mappings === 'string' 
          ? mapping.column_mappings 
          : JSON.stringify(mapping.column_mappings)
      };
      
      const { data, error } = await supabase
        .from('gl_mappings')
        .insert(dbMapping)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, mapping: convertToGlMapping(data) };
    } catch (error) {
      console.error('Error creating mapping:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Update an existing mapping
   */
  async updateMapping(id: string, mapping: Partial<GlMapping>) {
    try {
      // Convert column_mappings to string if needed for DB
      const dbMapping = {
        ...mapping,
        column_mappings: mapping.column_mappings ? 
          (typeof mapping.column_mappings === 'string' 
            ? mapping.column_mappings 
            : JSON.stringify(mapping.column_mappings))
          : undefined
      };
      
      const { data, error } = await supabase
        .from('gl_mappings')
        .update(dbMapping)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, mapping: convertToGlMapping(data) };
    } catch (error) {
      console.error('Error updating mapping:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Delete a mapping
   */
  async deleteMapping(id: string) {
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting mapping:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Get Supabase table columns
   */
  async getSupabaseTableColumns(tableName: string) {
    try {
      const { data, error } = await supabase
        .rpc('gl_get_table_columns', { table_name: tableName });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting Supabase table columns:', error);
      throw error;
    }
  },
  
  /**
   * List available Supabase tables
   */
  async listSupabaseTables() {
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('*');
      
      if (error) throw error;
      
      return data.map((row: any) => row.table_name);
    } catch (error) {
      console.error('Error listing Supabase tables:', error);
      throw error;
    }
  },
  
  /**
   * Sync data
   */
  async syncData(mappingId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          mappingId
        }
      });
      
      if (error) throw error;
      
      return { success: true, result: data };
    } catch (error) {
      console.error('Error syncing data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Get sync logs
   */
  async getSyncLogs(mappingId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return { success: true, logs: data };
    } catch (error) {
      console.error('Error getting sync logs:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Get sync errors
   */
  async getSyncErrors(mappingId: string, includeResolved: boolean = false) {
    try {
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', {
          p_mapping_id: mappingId,
          p_include_resolved: includeResolved
        });
      
      if (error) throw error;
      
      return { success: true, errors: data as SyncError[] };
    } catch (error) {
      console.error('Error getting sync errors:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  /**
   * Resolve a sync error
   */
  async resolveSyncError(errorId: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .rpc('gl_resolve_sync_error', {
          p_error_id: errorId,
          p_resolution_notes: notes || null
        });
      
      if (error) throw error;
      
      return { success: true, result: data };
    } catch (error) {
      console.error('Error resolving sync error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};
