
import { supabase } from '@/integrations/supabase/client';
import { GlConnection, GlideTable, ProductSyncResult } from '@/types/glsync';

/**
 * GlSync API Service
 * Provides methods for interacting with the Glide sync API
 */
export const glSyncApi = {
  /**
   * Tests a connection to Glide
   */
  async testConnection(connectionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId
        }
      });

      if (error) {
        console.error('Error testing connection:', error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error('Exception in testConnection:', err);
      return false;
    }
  },

  /**
   * Lists tables in a Glide app
   */
  async listGlideTables(connectionId: string): Promise<{ success: boolean, tables?: GlideTable[], error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'listGlideTables',
          connectionId
        }
      });

      if (error) {
        console.error('Error listing Glide tables:', error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        tables: data?.tables as GlideTable[] || [],
        error: data?.error
      };
    } catch (err) {
      console.error('Exception in listGlideTables:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Synchronizes data using a specific mapping
   */
  async syncData(connectionId: string, mappingId: string): Promise<ProductSyncResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId,
          mappingId
        }
      });

      if (error) {
        console.error('Error syncing data:', error);
        return null;
      }

      return data as ProductSyncResult;
    } catch (err) {
      console.error('Exception in syncData:', err);
      return null;
    }
  },

  /**
   * Retries failed sync operations
   */
  async retryFailedSync(connectionId: string, mappingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'retryFailedSync',
          connectionId,
          mappingId
        }
      });

      if (error) {
        console.error('Error retrying failed sync:', error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error('Exception in retryFailedSync:', err);
      return false;
    }
  },

  /**
   * Gets all connections
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

      return data as GlConnection[];
    } catch (err) {
      console.error('Exception in getConnections:', err);
      return [];
    }
  },

  /**
   * Gets a specific connection
   */
  async getConnection(id: string): Promise<GlConnection | null> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching connection:', error);
        return null;
      }

      return data as GlConnection;
    } catch (err) {
      console.error('Exception in getConnection:', err);
      return null;
    }
  },

  /**
   * Creates a new connection
   */
  async createConnection(connection: Partial<GlConnection>): Promise<GlConnection | null> {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .insert([connection])
        .select()
        .single();

      if (error) {
        console.error('Error creating connection:', error);
        return null;
      }

      return data as GlConnection;
    } catch (err) {
      console.error('Exception in createConnection:', err);
      return null;
    }
  },

  /**
   * Gets information about Supabase tables
   */
  async getSupabaseTables(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_tables');

      if (error) {
        console.error('Error fetching Supabase tables:', error);
        return [];
      }

      return data as string[];
    } catch (err) {
      console.error('Exception in getSupabaseTables:', err);
      return [];
    }
  },

  /**
   * Gets columns for a specific table
   */
  async getTableColumns(tableName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: tableName });

      if (error) {
        console.error(`Error fetching columns for table ${tableName}:`, error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getTableColumns:', err);
      return [];
    }
  }
};
