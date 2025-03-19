
import { supabase } from '@/integrations/supabase/client';
import { convertValue } from '@/utils/glsync-transformers';

/**
 * GlideAPI service that uses direct HTTP requests (cURL-style) instead of JSON
 * for better performance and simplicity
 */
export class GlideAPI {
  private apiKey: string;
  private appId: string;

  constructor(apiKey: string, appId: string) {
    this.apiKey = apiKey;
    this.appId = appId;
  }

  /**
   * Test the connection to the Glide API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appID: this.appId,
          queries: [{ limit: 1 }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Glide API error:', errorText);
        return { 
          success: false, 
          error: `API Error: ${response.status} ${response.statusText}` 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Connection test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * List tables from the Glide app
   */
  async listTables(): Promise<{ tables: Array<{ id: string; display_name: string }> }> {
    try {
      const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appID: this.appId,
          queries: [{ listTables: true }]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to list tables: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.tables && Array.isArray(data.tables)) {
        return {
          tables: data.tables.map((table: any) => ({
            id: table.id,
            display_name: table.name
          }))
        };
      }
      
      return { tables: [] };
    } catch (error) {
      console.error('Error listing tables:', error);
      throw error;
    }
  }

  /**
   * Get columns for a specific table
   */
  async getTableColumns(tableId: string): Promise<{ columns: Array<{ id: string; name: string; type: string }> }> {
    try {
      const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appID: this.appId,
          queries: [{
            tableName: tableId,
            limit: 1
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get table columns: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0 && data[0].columns) {
        // Extract columns from the response
        const columns = Object.entries(data[0].columns).map(([key, value]: [string, any]) => {
          return { 
            id: key, 
            name: value.name || key, 
            type: value.type || 'string'
          };
        });
        
        return { columns };
      } else if (data && Array.isArray(data) && data.length > 0 && data[0].rows && data[0].rows.length > 0) {
        // Alternative way - extract columns from the first row
        const sampleRow = data[0].rows[0];
        
        const columns = Object.keys(sampleRow).map(key => {
          const value = sampleRow[key];
          let type = typeof value;
          
          if (type === 'object' && value === null) {
            type = 'string'; // Default to string for null values
          }
          
          return { 
            id: key, 
            name: key === '$rowID' ? 'Row ID' : key, 
            type 
          };
        });
        
        return { columns };
      }
      
      return { columns: [] };
    } catch (error) {
      console.error('Error getting table columns:', error);
      throw error;
    }
  }

  /**
   * Sync data from Glide to Supabase
   */
  async syncData(glideTable: string, supabaseTable: string, columnMappings: Record<string, any>): Promise<{
    success: boolean;
    recordsProcessed?: number;
    error?: string;
  }> {
    try {
      let continuationToken = null;
      let processedRecords = 0;
      const errors = [];
      
      do {
        // Fetch batch of data from Glide with pagination
        const { rows, next, error } = await this.fetchTableData(glideTable, continuationToken);
        
        if (error) {
          return { success: false, error };
        }
        
        if (rows.length === 0) {
          break;
        }
        
        // Transform data based on column mappings
        const transformedRecords = rows.map(row => {
          const mappedRecord: Record<string, any> = {};
          
          // Ensure glide_row_id is always set
          mappedRecord['glide_row_id'] = row.$rowID;
          
          // Map fields based on column mappings
          Object.entries(columnMappings).forEach(([glideColumnId, mapping]) => {
            if (glideColumnId !== '$rowID') {
              const { supabase_column_name, data_type } = mapping as any;
              let value = row[glideColumnId];
              
              // Use the utility function for data conversion
              mappedRecord[supabase_column_name] = convertValue(value, data_type);
            }
          });
          
          return mappedRecord;
        });
        
        // Batch upsert records to avoid SQL limitations
        const batchSize = 100;
        for (let i = 0; i < transformedRecords.length; i += batchSize) {
          const batch = transformedRecords.slice(i, i + batchSize);
          
          // Use a type assertion to ensure the table name is valid
          const { error: upsertError } = await supabase
            .from(supabaseTable as any)
            .upsert(batch, {
              onConflict: 'glide_row_id',
              ignoreDuplicates: false
            });
          
          if (upsertError) {
            console.error('Upsert error:', upsertError);
            errors.push(upsertError.message);
          }
        }
        
        processedRecords += rows.length;
        continuationToken = next;
        
        // Add a log for each batch processed
        console.log(`Processed batch: ${rows.length} records. Total: ${processedRecords}`);
        
      } while (continuationToken);
      
      return { 
        success: errors.length === 0, 
        recordsProcessed: processedRecords,
        error: errors.length > 0 ? errors.join(', ') : undefined
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Helper function to fetch data from a Glide table with pagination
   */
  private async fetchTableData(tableName: string, continuationToken: string | null = null): Promise<{
    rows: any[];
    next: string | null;
    error?: string;
  }> {
    try {
      const queryObj: Record<string, any> = { 
        tableName,
        utc: true // Use UTC time format for consistency
      };
      
      if (continuationToken) {
        queryObj.startAt = continuationToken;
      }
      
      const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appID: this.appId,
          queries: [queryObj]
        })
      });
      
      if (!response.ok) {
        return { 
          rows: [], 
          next: null, 
          error: `API error: ${response.status} ${response.statusText}` 
        };
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        return {
          rows: data[0].rows || [],
          next: data[0].next || null
        };
      }
      
      return { rows: [], next: null };
    } catch (error) {
      console.error('Error fetching table data:', error);
      return { 
        rows: [], 
        next: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

/**
 * Factory function to create a GlideAPI instance
 */
export const createGlideApi = (connectionId: string): Promise<GlideAPI> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Use maybeSingle() instead of single() to handle potential multiple or no results
      const { data, error } = await supabase
        .from('gl_connections')
        .select('api_key, app_id')
        .eq('id', connectionId)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error(`Connection not found with ID: ${connectionId}`);
      }
      
      resolve(new GlideAPI(data.api_key, data.app_id));
    } catch (error) {
      reject(error);
    }
  });
};
