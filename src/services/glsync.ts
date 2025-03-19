
import { supabase } from '@/integrations/supabase/client';
import { GlConnection, GlMapping, GlideTable, ProductSyncResult } from '@/types/glsync';
import { SyncLog } from '@/types/syncLog';

interface GlSyncResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

// Helper to invoke edge functions
async function invokeFunction<T = any>(
  functionName: string, 
  body: Record<string, any>
): Promise<GlSyncResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });
    
    if (error) throw error;
    
    if (!data.success && data.error) {
      return {
        success: false,
        error: data.error,
      };
    }
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error invoking function:', functionName, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export const glSyncApi = {
  // Connections
  async listConnections(): Promise<{ success: boolean; connections?: GlConnection[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        success: true,
        connections: data,
      };
    } catch (error) {
      console.error('Error listing connections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async getConnectionById(id: string): Promise<{ success: boolean; connection?: GlConnection; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        connection: data,
      };
    } catch (error) {
      console.error('Error getting connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async createConnection(
    appId: string,
    apiKey: string,
    appName?: string
  ): Promise<{ success: boolean; connection?: GlConnection; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .insert({
          app_id: appId,
          api_key: apiKey,
          app_name: appName,
          status: 'inactive', // Initial status
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        connection: data,
      };
    } catch (error) {
      console.error('Error creating connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async updateConnection(
    id: string,
    updates: Partial<GlConnection>
  ): Promise<{ success: boolean; connection?: GlConnection; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        connection: data,
      };
    } catch (error) {
      console.error('Error updating connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async deleteConnection(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('gl_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async testConnection(connectionId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await invokeFunction('glsync', {
        action: 'testConnection',
        connectionId,
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return {
        success: true,
        message: response.data?.message || 'Connection successful',
      };
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  // Mappings
  async listMappings(connectionId?: string): Promise<{ success: boolean; mappings?: GlMapping[]; error?: string }> {
    try {
      let query = supabase
        .from('gl_mapping_status')
        .select('*');
      
      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }
      
      const { data, error } = await query.order('glide_table_display_name', { ascending: true });
      
      if (error) throw error;
      
      return {
        success: true,
        mappings: data,
      };
    } catch (error) {
      console.error('Error listing mappings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async getMappingById(id: string): Promise<{ success: boolean; mapping?: GlMapping; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .eq('mapping_id', id)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        mapping: data,
      };
    } catch (error) {
      console.error('Error getting mapping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async createMapping(
    mapping: Partial<GlMapping>
  ): Promise<{ success: boolean; mapping?: GlMapping; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .insert(mapping)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        mapping: data,
      };
    } catch (error) {
      console.error('Error creating mapping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async updateMapping(
    id: string,
    updates: Partial<GlMapping>
  ): Promise<{ success: boolean; mapping?: GlMapping; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        mapping: data,
      };
    } catch (error) {
      console.error('Error updating mapping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async deleteMapping(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting mapping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  // Glide tables and columns
  async listGlideTables(connectionId: string): Promise<{ success: boolean; tables?: GlideTable[]; error?: string }> {
    try {
      const response = await invokeFunction('glsync', {
        action: 'getTableNames',
        connectionId,
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return {
        success: true,
        tables: response.data?.tables || [],
      };
    } catch (error) {
      console.error('Error listing Glide tables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async getGlideTableColumns(
    connectionId: string,
    tableId: string
  ): Promise<{ success: boolean; columns?: any[]; error?: string }> {
    try {
      const response = await invokeFunction('glsync', {
        action: 'getColumnMappings',
        connectionId,
        tableId,
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return {
        success: true,
        columns: response.data?.columns || [],
      };
    } catch (error) {
      console.error('Error getting Glide table columns:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  // Sync
  async syncData(
    connectionId: string,
    mappingId: string
  ): Promise<ProductSyncResult> {
    try {
      const response = await invokeFunction<ProductSyncResult>('glsync', {
        action: 'syncData',
        connectionId,
        mappingId,
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return {
        success: true,
        recordsProcessed: response.data?.recordsProcessed || 0,
        failedRecords: response.data?.failedRecords || 0,
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        recordsProcessed: 0,
        failedRecords: 0,
      };
    }
  },
  
  async getSyncLogs(
    mappingId: string, 
    limit: number = 10
  ): Promise<{ success: boolean; logs?: SyncLog[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return {
        success: true,
        logs: data,
      };
    } catch (error) {
      console.error('Error getting sync logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  async getSyncErrors(
    mappingId: string, 
    includeResolved: boolean = false
  ): Promise<{ success: boolean; errors?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', { 
          p_mapping_id: mappingId,
          p_limit: 100,
          p_include_resolved: includeResolved
        });
      
      if (error) throw error;
      
      return {
        success: true,
        errors: data,
      };
    } catch (error) {
      console.error('Error getting sync errors:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
};
