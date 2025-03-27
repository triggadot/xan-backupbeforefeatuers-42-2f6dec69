import { supabase } from '@/integrations/supabase/client';
import { 
  GlConnection, 
  GlMapping, 
  GlSyncLog, 
  GlSyncStatus,
  GlRecentLog,
  SyncRequestPayload,
  ProductSyncResult,
  GlideTable,
  GlSyncRecord
} from '@/types/glsync';

export const glSyncApi = {
  // Connection management
  async getConnections(): Promise<GlConnection[]> {
    const { data, error } = await supabase
      .from('gl_connections')
      .select('*')
      .order('created_at', { ascending: false });
    
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
      .insert({
        app_name: connection.app_name || 'Unnamed Glide App',
        app_id: connection.app_id,
        api_key: connection.api_key,
        status: 'pending'
      })
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
    let query = supabase.from('gl_mappings').select('*').order('created_at', { ascending: false });
    
    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw new Error(error.message);
    }
    
    return (data || []).map(mapping => ({
      ...mapping,
      column_mappings: mapping.column_mappings as unknown as Record<string, { 
        glide_column_name: string;
        supabase_column_name: string;
        data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
      }>
    })) as GlMapping[];
  },

  async getMapping(id: string): Promise<GlMapping> {
    const { data, error } = await supabase
      .from('gl_mappings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      ...data,
      column_mappings: data.column_mappings as unknown as Record<string, { 
        glide_column_name: string;
        supabase_column_name: string;
        data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
      }>
    } as GlMapping;
  },

  async addMapping(mapping: Omit<GlMapping, 'id' | 'created_at'>): Promise<GlMapping> {
    // Ensure we have a default $rowID mapping if not provided
    if (!mapping.column_mappings['$rowID']) {
      mapping.column_mappings['$rowID'] = {
        glide_column_name: '$rowID',
        supabase_column_name: 'glide_row_id',
        data_type: 'string'
      };
    }
    
    const { data, error } = await supabase
      .from('gl_mappings')
      .insert({
        connection_id: mapping.connection_id,
        glide_table: mapping.glide_table,
        glide_table_display_name: mapping.glide_table_display_name,
        supabase_table: mapping.supabase_table,
        column_mappings: mapping.column_mappings as any,
        sync_direction: mapping.sync_direction,
        enabled: mapping.enabled
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      ...data,
      column_mappings: data.column_mappings as unknown as Record<string, { 
        glide_column_name: string;
        supabase_column_name: string;
        data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
      }>
    } as GlMapping;
  },

  async updateMapping(id: string, mapping: Partial<GlMapping>): Promise<GlMapping> {
    const updateData: any = { ...mapping };
    if (mapping.column_mappings) {
      updateData.column_mappings = mapping.column_mappings;
    }
    
    const { data, error } = await supabase
      .from('gl_mappings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      ...data,
      column_mappings: data.column_mappings as unknown as Record<string, { 
        glide_column_name: string;
        supabase_column_name: string;
        data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
      }>
    } as GlMapping;
  },

  async deleteMapping(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_mappings')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // Get Supabase table columns
  async getSupabaseTableColumns(tableName: string): Promise<{ column_name: string, data_type: string }[]> {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    if (error) throw new Error(error.message);
    return data || [];
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
      if (error.code === '42P01') {
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
      if (error.code === '42P01') {
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
      if (error.code === '42P01') {
        return [];
      }
      throw new Error(error.message);
    }
    return data as GlRecentLog[];
  },

  // Edge function interaction
  async callSyncFunction(payload: SyncRequestPayload): Promise<any> {
    console.log('Calling sync function with payload:', payload);
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: payload,
    });

    if (error) {
      console.error('Error calling sync function:', error);
      throw new Error(error.message);
    }
    return data;
  },

  async testConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Testing connection ${connectionId}`);
      const result = await this.callSyncFunction({
        action: 'testConnection',
        connectionId,
      });
      
      return { 
        success: result.success === true,
        error: result.error
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async listGlideTables(connectionId: string): Promise<{ tables: GlideTable[] } | { error: string }> {
    try {
      console.log(`Getting existing Glide tables from database`);
      const result = await this.callSyncFunction({
        action: 'getTableNames',
        connectionId,
      });
      
      if (result.tables) {
        return { tables: result.tables };
      }
      
      return { error: result.error || 'Failed to list tables' };
    } catch (error) {
      console.error('Error listing tables:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  async getGlideTableColumns(connectionId: string, tableId: string): Promise<{ columns: any[] } | { error: string }> {
    try {
      console.log(`Getting columns for table ${tableId}`);
      const result = await this.callSyncFunction({
        action: 'getColumnMappings',
        connectionId,
        tableId,
      });
      
      if (result.columns) {
        return { columns: result.columns };
      }
      
      return { error: result.error || 'Failed to get columns' };
    } catch (error) {
      console.error('Error getting columns:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async syncData(connectionId: string, mappingId: string): Promise<{ success: boolean; recordsProcessed?: number; failedRecords?: number; errors?: any[]; error?: string }> {
    console.log(`Starting sync for mapping ${mappingId} of connection ${connectionId}`);
    try {
      const result = await this.callSyncFunction({
        action: 'syncData',
        connectionId,
        mappingId,
      });
      
      console.log('Sync result:', result);
      return { 
        success: result.success ?? true, 
        recordsProcessed: result.recordsProcessed,
        failedRecords: result.failedRecords,
        errors: result.errors
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // New method to map relationships between tables
  async mapRelationships(mappingId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    console.log(`Mapping relationships for mapping ${mappingId}`);
    try {
      const result = await this.callSyncFunction({
        action: 'mapRelationships',
        mappingId,
      });
      
      console.log('Relationship mapping result:', result);
      return { 
        success: result.success ?? true, 
        result: result.result
      };
    } catch (error) {
      console.error('Error mapping relationships:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getSyncErrors(mappingId: string): Promise<GlSyncRecord[]> {
    console.log(`Fetching sync errors for mapping ${mappingId}`);
    try {
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', { p_mapping_id: mappingId, p_limit: 100 });
      
      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message);
      }
      
      if (!data) return [];
      
      return data.map((record: any) => ({
        type: record.error_type,
        message: record.error_message,
        record: record.record_data,
        timestamp: record.created_at,
        retryable: record.retryable
      })) as GlSyncRecord[];
    } catch (error) {
      console.error('Error fetching sync errors:', error);
      return [];
    }
  },
  
  // New method to run relationship mapping across all tables
  async mapAllRelationships(): Promise<{ success: boolean; result?: any; error?: string }> {
    console.log('Mapping relationships across all tables');
    try {
      const { data, error } = await supabase.rpc('glsync_map_all_relationships');
      
      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message);
      }
      
      console.log('All relationships mapping result:', data);
      return { 
        success: true, 
        result: data
      };
    } catch (error) {
      console.error('Error mapping all relationships:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};
