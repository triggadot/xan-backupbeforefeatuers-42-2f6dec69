
import { supabase } from '@/integrations/supabase/client';
import { 
  GlConnection, 
  GlMapping, 
  GlSyncLog, 
  GlSyncStatus,
  GlRecentLog,
  SyncRequestPayload,
  GlColumnMapping,
  ProductSyncResult
} from '@/types/glsync';

export const glSyncApi = {
  // Connection management
  async getConnections(): Promise<GlConnection[]> {
    const { data, error } = await supabase
      .from('gl_connections')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data as GlConnection[];
  },

  async getConnection(id: string): Promise<GlConnection> {
    const { data, error } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlConnection;
  },

  async addConnection(connection: Omit<GlConnection, 'id' | 'created_at'>): Promise<GlConnection> {
    const { data, error } = await supabase
      .from('gl_connections')
      .insert(connection)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlConnection;
  },

  async updateConnection(id: string, connection: Partial<GlConnection>): Promise<GlConnection> {
    const { data, error } = await supabase
      .from('gl_connections')
      .update(connection)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlConnection;
  },

  async deleteConnection(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_connections')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // Mapping management
  async getMappings(connectionId?: string): Promise<GlMapping[]> {
    let query = supabase.from('gl_mappings').select('*');
    
    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01') {
        // Return empty array instead of throwing error when table doesn't exist yet
        return [];
      }
      throw new Error(error.message);
    }
    return data as GlMapping[];
  },

  async getMapping(id: string): Promise<GlMapping> {
    const { data, error } = await supabase
      .from('gl_mappings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlMapping;
  },

  async addMapping(mapping: Omit<GlMapping, 'id' | 'created_at'>): Promise<GlMapping> {
    const { data, error } = await supabase
      .from('gl_mappings')
      .insert(mapping)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlMapping;
  },

  async updateMapping(id: string, mapping: Partial<GlMapping>): Promise<GlMapping> {
    const { data, error } = await supabase
      .from('gl_mappings')
      .update(mapping)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlMapping;
  },

  async deleteMapping(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_mappings')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // Column mappings
  async getColumnMappings(connectionId: string, tableId: string): Promise<GlColumnMapping[]> {
    const { data, error } = await supabase
      .from('gl_column_mappings')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('supabase_table', tableId);
    
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01') {
        // Return empty array instead of throwing error when table doesn't exist yet
        return [];
      }
      throw new Error(error.message);
    }
    return data as GlColumnMapping[];
  },

  async addColumnMapping(mapping: Omit<GlColumnMapping, 'id'>): Promise<GlColumnMapping> {
    const { data, error } = await supabase
      .from('gl_column_mappings')
      .insert(mapping)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as GlColumnMapping;
  },

  // Sync logs
  async getSyncLogs(mappingId?: string, limit: number = 20): Promise<GlSyncLog[]> {
    let query = supabase
      .from('gl_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (mappingId) {
      query = query.eq('mapping_id', mappingId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01') {
        // Return empty array instead of throwing error when table doesn't exist yet
        return [];
      }
      throw new Error(error.message);
    }
    return data as GlSyncLog[];
  },

  // Get sync status for all mappings
  async getSyncStatus(): Promise<GlSyncStatus[]> {
    const { data, error } = await supabase
      .from('gl_mapping_status')
      .select('*')
      .order('last_sync_started_at', { ascending: false });
    
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01') {
        // Return empty array instead of throwing error
        return [];
      }
      throw new Error(error.message);
    }
    return data as unknown as GlSyncStatus[];
  },

  // Get recent sync logs with additional info
  async getRecentLogs(limit: number = 20): Promise<GlRecentLog[]> {
    const { data, error } = await supabase
      .from('gl_recent_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01') {
        // Return empty array instead of throwing error
        return [];
      }
      throw new Error(error.message);
    }
    return data as GlRecentLog[];
  },

  // Edge function interaction
  async callSyncFunction(payload: SyncRequestPayload): Promise<any> {
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: payload,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async testConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.callSyncFunction({
        action: 'testConnection',
        connectionId,
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async listGlideTables(connectionId: string): Promise<{ tables: string[] } | { error: string }> {
    try {
      return await this.callSyncFunction({
        action: 'listGlideTables',
        connectionId,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  async getGlideTableColumns(connectionId: string, tableId: string): Promise<{ columns: any[] } | { error: string }> {
    try {
      return await this.callSyncFunction({
        action: 'getColumnMappings',
        connectionId,
        tableId,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async syncData(connectionId: string, mappingId: string): Promise<{ success: boolean; recordsProcessed?: number; failedRecords?: number; errors?: any[]; error?: string }> {
    try {
      const result = await this.callSyncFunction({
        action: 'syncData',
        connectionId,
        mappingId,
      });
      
      return { 
        success: result.success ?? true, 
        recordsProcessed: result.recordsProcessed,
        failedRecords: result.failedRecords,
        errors: result.errors
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};
