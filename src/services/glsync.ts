import { supabase } from '@/integrations/supabase/client';
import { 
  GlConnection, 
  GlideTable, 
  SyncResult,
  ProductSyncResult,
  GlSyncRecord,
  MappingToValidate, 
  ColumnMappingSuggestion, 
  GlMapping
} from '@/types/glsync';
import { createLogger } from '@/services/logger';

// Create a dedicated logger for the glsync service
const logger = createLogger('GlSyncService');

/**
 * Comprehensive GlSync Service
 * Provides all methods for interacting with Glide and Supabase sync functionality
 */
export const glSyncService = {
  /**
   * Tests the connection to Glide
   * @param connectionId The ID of the connection to test
   * @returns A promise that resolves to a boolean indicating whether the connection was successful
   */
  async testConnection(connectionId: string): Promise<boolean> {
    const timer = logger.timer('testConnection');
    logger.info(`Testing connection ${connectionId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId: connectionId,
          logLevel: 'detailed'
        }
      });

      if (error) {
        logger.error(`Error testing connection:`, { data: error });
        return false;
      }

      const success = data?.success || false;
      logger.info(`Connection test ${success ? 'successful' : 'failed'}`);
      return success;
    } catch (err) {
      logger.error(`Exception in testConnection:`, { data: err });
      return false;
    } finally {
      timer.stop();
    }
  },

  /**
   * Lists the tables in Glide
   * @param connectionId The ID of the connection to list tables for
   * @returns A promise that resolves to an array of Glide tables
   */
  async listGlideTables(connectionId: string): Promise<GlideTable[]> {
    const timer = logger.timer('listGlideTables');
    logger.info(`Listing Glide tables for connection ${connectionId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'listGlideTables',
          connectionId: connectionId,
          logLevel: 'detailed'
        }
      });

      if (error) {
        logger.error(`Error listing Glide tables:`, { data: error });
        return [];
      }

      const tables = data?.tables || [];
      logger.info(`Retrieved ${tables.length} tables from Glide`);
      return tables;
    } catch (err) {
      logger.error(`Exception in listGlideTables:`, { data: err });
      return [];
    } finally {
      timer.stop();
    }
  },

  /**
   * Syncs data between Glide and Supabase
   * @param connectionId The ID of the connection to sync data for
   * @param mappingId The ID of the mapping to use for syncing
   * @param options Additional options for the sync operation
   * @returns A promise that resolves to the sync result
   */
  async syncData(
    connectionId: string, 
    mappingId: string,
    options: {
      logLevel?: 'minimal' | 'detailed'
    } = {}
  ): Promise<SyncResult | null> {
    const { logLevel = 'detailed' } = options;
    const timer = logger.timer('syncData');
    
    logger.info(`Syncing data for mapping ${mappingId}`, {
      data: { connectionId, mappingId, logLevel }
    });
    
    try {
      // Get mapping details for better logging
      if (logLevel === 'detailed') {
        try {
          const { data, error } = await supabase
            .from('gl_mappings')
            .select('name, glide_table, supabase_table')
            .eq('id', mappingId)
            .single();
            
          if (!error && data && 'name' in data && 'glide_table' in data && 'supabase_table' in data) {
            logger.info(`Sync details:`, {
              data: {
                mappingName: data.name,
                glideTable: data.glide_table,
                supabaseTable: data.supabase_table
              }
            });
          }
        } catch (err) {
          logger.warn(`Could not fetch mapping details`, { data: err });
        }
      }
      
      // Prepare request body
      const requestBody = {
        action: 'syncData',
        connectionId,
        mappingId,
        logLevel
      };
      
      logger.debug(`Sending request to edge function:`, { data: requestBody });
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: requestBody
      });

      if (error) {
        logger.error(`Error syncing data:`, { data: error });
        return null;
      }
      
      // Add timing information to the result
      const duration = timer.stop({ 
        message: `Sync completed for mapping ${mappingId}`,
        level: data?.success ? 'info' : 'warn',
        data: {
          success: data?.success,
          recordsProcessed: data?.recordsProcessed,
          error: data?.error
        }
      });
      
      // Add syncTime to the result if not already present
      if (data && !data.syncTime) {
        data.syncTime = duration;
      }

      return data as SyncResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Exception in syncData: ${errorMessage}`, { data: err });
      
      // Return a structured error result
      return {
        success: false,
        error: errorMessage,
        syncTime: timer.stop({ 
          message: `Sync failed for mapping ${mappingId}`,
          level: 'error',
          logDuration: false
        })
      };
    }
  },

  /**
   * Gets column mappings for a given table in Glide
   * @param connectionId The ID of the connection to get column mappings for
   * @param tableId The ID of the table to get column mappings for
   * @returns A promise that resolves to an array of column mappings
   */
  async getColumnMappings(connectionId: string, tableId: string): Promise<ColumnMappingSuggestion[]> {
    const timer = logger.timer('getColumnMappings');
    logger.info(`Getting column mappings for table ${tableId} in connection ${connectionId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'getColumnMappings',
          connectionId: connectionId,
          tableId: tableId
        }
      });

      if (error) {
        logger.error(`Error getting column mappings:`, { data: error });
        return [];
      }

      const mappings = data?.columnMappings || [];
      logger.info(`Retrieved ${mappings.length} column mappings`);
      return mappings;
    } catch (err) {
      logger.error(`Exception in getColumnMappings:`, { data: err });
      return [];
    } finally {
      timer.stop();
    }
  },

  /**
   * Validates a mapping
   * @param mapping The mapping to validate
   * @returns A promise that resolves to a boolean indicating whether the mapping is valid
   */
  async validateMapping(mapping: MappingToValidate): Promise<boolean> {
    const timer = logger.timer('validateMapping');
    logger.info(`Validating mapping for table ${mapping.supabase_table}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'validateMapping',
          mapping: mapping
        }
      });

      if (error) {
        logger.error(`Error validating mapping:`, { data: error });
        return false;
      }

      const isValid = data?.isValid || false;
      logger.info(`Mapping validation ${isValid ? 'passed' : 'failed'}`);
      return isValid;
    } catch (err) {
      logger.error(`Exception in validateMapping:`, { data: err });
      return false;
    } finally {
      timer.stop();
    }
  },

  /**
   * Maps all relationships between tables in the database
   * 
   * This function calls a database procedure to identify and map relationships between tables
   * based on the naming convention where foreign keys are stored in columns with the
   * prefix 'rowid_' that reference the 'glide_row_id' column in target tables.
   * 
   * @param options - Configuration options for relationship mapping
   * @param options.tableFilter - Optional string filter to limit which tables are included in the mapping
   * @param options.retryCount - Optional number of times to retry failed mappings
   * @returns A promise that resolves to a mapping result object containing:
   *   - success: boolean indicating if the operation was successful
   *   - result: optional result data from the database procedure
   *   - error: optional error message if the operation failed
   * 
   * @example
   * // Map all relationships
   * const result = await glSyncService.mapAllRelationships();
   * 
   * // Map relationships for specific tables
   * const result = await glSyncService.mapAllRelationships({ 
   *   tableFilter: 'gl_invoices' 
   * });
   * 
   * // Map relationships with a retry count
   * const result = await glSyncService.mapAllRelationships({ 
   *   retryCount: 3 
   * });
   */
  async mapAllRelationships(options?: {
    tableFilter?: string;
    retryCount?: number;
  }): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    const timer = logger.timer('mapAllRelationships');
    logger.info(`Mapping all relationships`, { data: options });
    
    try {
      // First check if there are any valid mappings to process
      const { data: validationData, error: validationError } = await supabase
        .from('gl_relationship_mapping_log')
        .select('count')
        .eq('status', 'pending');
      
      if (validationError) {
        logger.error(`Error validating pending relationships:`, { data: validationError });
        return { success: false, error: validationError.message };
      }

      const pendingCount = validationData?.[0]?.count ?? 0;
      logger.info(`Found ${pendingCount} pending relationships`);
      
      // Call the SQL function to map all relationships
      const { data, error } = await supabase.rpc('map_all_sb_relationships', {
        p_table_filter: options?.tableFilter || null
      });

      if (error) {
        logger.error(`Error mapping relationships:`, { data: error });
        return { success: false, error: error.message };
      }

      logger.info(`Relationship mapping completed successfully`, { data });
      return { success: true, result: data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Exception in mapAllRelationships: ${errorMessage}`, { data: err });
      return { success: false, error: errorMessage };
    } finally {
      timer.stop();
    }
  },

  /**
   * Validates relationships to ensure data exists before mapping
   * @returns A promise that resolves to a validation result object
   */
  async validateRelationships(): Promise<{
    success: boolean;
    validTables: string[];
    error?: string;
  }> {
    const timer = logger.timer('validateRelationships');
    logger.info(`Validating relationships`);
    
    try {
      // Get a list of tables with pending relationships
      const { data, error } = await supabase
        .from('gl_relationship_mappings')
        .select('supabase_table, target_table')
        .eq('enabled', true);
      
      if (error) {
        logger.error(`Error fetching relationship mappings:`, { data: error });
        return { success: false, validTables: [], error: error.message };
      }

      // Extract table names from the relationship mappings
      // Handle the case where data might be null or undefined
      const sourceTableNames = data?.map(d => d.supabase_table) || [];
      const targetTableNames = data?.map(d => d.target_table) || [];
      
      // Create a unique set of table names
      const tables = [...new Set([...sourceTableNames, ...targetTableNames])];
      
      logger.info(`Found ${tables.length} tables with relationships`);

      // For this implementation, we'll assume all tables in the relationship mappings
      // are valid. This is a safe assumption since the relationship mappings
      // are created based on existing tables.
      const validTables = [...tables];
      
      logger.info(`Considering all ${validTables.length} tables as valid for relationship mapping`);
      return { 
        success: true, 
        validTables 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Exception in validateRelationships: ${errorMessage}`, { data: err });
      return { success: false, validTables: [], error: errorMessage };
    } finally {
      timer.stop();
    }
  },

  /**
   * Retries failed sync operations
   * @param connectionId - The connection ID
   * @param mappingId - The mapping ID
   * @returns Promise resolving to success status
   */
  async retryFailedSync(connectionId: string, mappingId: string): Promise<boolean> {
    const timer = logger.timer('retryFailedSync');
    logger.info(`Retrying failed sync for mapping ${mappingId}`, {
      data: { connectionId, mappingId }
    });
    
    try {
      // Use the syncData method with retry parameters
      const result = await this.syncData(connectionId, mappingId, {
        logLevel: 'detailed'
      });
      
      const success = result !== null && result.success;
      
      if (!success) {
        logger.error(`Retry failed for mapping ${mappingId}`);
      } else {
        logger.info(`Retry successful for mapping ${mappingId}`, {
          data: {
            recordsProcessed: result?.recordsProcessed,
            syncTime: result?.syncTime
          }
        });
      }
      
      timer.stop();
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Exception in retryFailedSync: ${errorMessage}`, { data: err });
      timer.stop();
      return false;
    }
  },

  /**
   * Gets all connections
   * @returns Promise resolving to array of connections
   */
  async getConnections(): Promise<GlConnection[]> {
    const timer = logger.timer('getConnections');
    logger.info('Fetching all connections');
    
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching connections:', { data: error });
        return [];
      }

      logger.info(`Retrieved ${data.length} connections`);
      return data as GlConnection[];
    } catch (err) {
      logger.error('Exception in getConnections:', { data: err });
      return [];
    } finally {
      timer.stop();
    }
  },

  /**
   * Gets a specific connection
   * @param id Connection ID
   * @returns Promise resolving to connection or null
   */
  async getConnection(id: string): Promise<GlConnection | null> {
    const timer = logger.timer('getConnection');
    logger.info(`Fetching connection ${id}`);
    
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Error fetching connection ${id}:`, { data: error });
        return null;
      }

      logger.info(`Retrieved connection ${id}`);
      return data as GlConnection;
    } catch (err) {
      logger.error(`Exception in getConnection for ${id}:`, { data: err });
      return null;
    } finally {
      timer.stop();
    }
  },

  /**
   * Creates a new connection
   * @param connection Connection data
   * @returns Promise resolving to created connection or null
   */
  async createConnection(connection: Partial<GlConnection>): Promise<GlConnection | null> {
    const timer = logger.timer('createConnection');
    logger.info('Creating new connection');
    
    try {
      // Ensure we have the required fields
      if (!connection.api_key || !connection.app_id) {
        logger.error('Missing required fields for connection creation');
        return null;
      }

      // Create a properly typed connection object
      const connectionData = {
        api_key: connection.api_key,
        app_id: connection.app_id,
        app_name: connection.app_name || null,
        created_at: new Date().toISOString(),
        status: 'active' as const,
        id: connection.id,
        last_sync: connection.last_sync || null,
        settings: connection.settings || null
      };

      const { data, error } = await supabase
        .from('gl_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating connection:', { data: error });
        return null;
      }

      logger.info(`Connection created with ID ${data.id}`);
      return data as GlConnection;
    } catch (err) {
      logger.error('Exception in createConnection:', { data: err });
      return null;
    } finally {
      timer.stop();
    }
  },

  /**
   * Updates an existing connection
   * @param id Connection ID
   * @param updates Connection updates
   * @returns Promise resolving to updated connection or null
   */
  async updateConnection(id: string, updates: Partial<GlConnection>): Promise<GlConnection | null> {
    const timer = logger.timer('updateConnection');
    logger.info(`Updating connection ${id}`);
    
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating connection ${id}:`, { data: error });
        return null;
      }

      logger.info(`Connection ${id} updated successfully`);
      return data as GlConnection;
    } catch (err) {
      logger.error(`Exception in updateConnection for ${id}:`, { data: err });
      return null;
    } finally {
      timer.stop();
    }
  },

  /**
   * Creates a new mapping
   * @param mapping Mapping data
   * @returns Promise resolving to created mapping or null
   */
  async createMapping(mapping: Partial<GlMapping>): Promise<GlMapping | null> {
    const timer = logger.timer('createMapping');
    logger.info('Creating new mapping');
    
    try {
      // Ensure we have the required fields
      if (!mapping.connection_id || !mapping.glide_table || !mapping.supabase_table) {
        logger.error('Missing required fields for mapping creation');
        return null;
      }

      // Create a properly typed mapping object
      const mappingData = {
        connection_id: mapping.connection_id,
        glide_table: mapping.glide_table,
        supabase_table: mapping.supabase_table,
        glide_table_display_name: mapping.glide_table_display_name || mapping.glide_table,
        column_mappings: mapping.column_mappings ? JSON.stringify(mapping.column_mappings) : '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enabled: mapping.enabled !== undefined ? mapping.enabled : true,
        sync_direction: mapping.sync_direction || 'to_supabase',
        id: mapping.id
      };

      const { data, error } = await supabase
        .from('gl_mappings')
        .insert(mappingData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating mapping:', { data: error });
        return null;
      }

      logger.info(`Mapping created with ID ${data.id}`);
      
      // Parse the column_mappings JSON string back to an object
      const result = {
        ...data,
        column_mappings: typeof data.column_mappings === 'string' 
          ? JSON.parse(data.column_mappings) 
          : data.column_mappings
      };
      
      return result as unknown as GlMapping;
    } catch (err) {
      logger.error('Exception in createMapping:', { data: err });
      return null;
    } finally {
      timer.stop();
    }
  },

  /**
   * Updates an existing mapping
   * @param id Mapping ID
   * @param updates Mapping updates
   * @returns Promise resolving to updated mapping or null
   */
  async updateMapping(id: string, updates: Partial<GlMapping>): Promise<GlMapping | null> {
    const timer = logger.timer('updateMapping');
    logger.info(`Updating mapping ${id}`);
    
    try {
      // Convert the column_mappings to a format Supabase can handle
      const updatesToApply = {
        ...updates,
        column_mappings: updates.column_mappings ? JSON.stringify(updates.column_mappings) : undefined,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('gl_mappings')
        .update(updatesToApply)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating mapping ${id}:`, { data: error });
        return null;
      }

      logger.info(`Mapping ${id} updated successfully`);
      // Type assertion to handle the column_mappings conversion
      return data as unknown as GlMapping;
    } catch (err) {
      logger.error(`Exception in updateMapping for ${id}:`, { data: err });
      return null;
    } finally {
      timer.stop();
    }
  },

  /**
   * Deletes an existing connection
   * @param id Connection ID
   * @returns Promise resolving to success status
   */
  async deleteConnection(id: string): Promise<boolean> {
    const timer = logger.timer('deleteConnection');
    logger.info(`Deleting connection ${id}`);
    
    try {
      const { error } = await supabase
        .from('gl_connections')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Error deleting connection ${id}:`, { data: error });
        return false;
      }

      logger.info(`Connection ${id} deleted successfully`);
      return true;
    } catch (err) {
      logger.error(`Exception in deleteConnection for ${id}:`, { data: err });
      return false;
    } finally {
      timer.stop();
    }
  },

  /**
   * Gets information about Supabase tables
   * @returns Promise resolving to array of table names
   */
  async getSupabaseTables(): Promise<string[]> {
    const timer = logger.timer('getSupabaseTables');
    logger.info('Fetching Supabase tables');
    
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('table_name');

      if (error) {
        logger.error('Error fetching Supabase tables:', { data: error });
        return [];
      }

      // Safely convert to string array
      const tables = data.map(row => String(row.table_name));
      logger.info(`Retrieved ${tables.length} Supabase tables`);
      return tables;
    } catch (err) {
      logger.error('Exception in getSupabaseTables:', { data: err });
      return [];
    } finally {
      timer.stop();
    }
  },

  /**
   * Gets columns for a specific table
   * @param tableName Table name
   * @returns Promise resolving to array of column information
   */
  async getTableColumns(tableName: string): Promise<any[]> {
    const timer = logger.timer('getTableColumns');
    logger.info(`Fetching columns for table ${tableName}`);
    
    try {
      // Query the information schema for column information
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      });

      if (error) {
        logger.error(`Error fetching columns for table ${tableName}:`, { data: error });
        return [];
      }

      logger.info(`Retrieved ${data.length} columns for table ${tableName}`);
      return data || [];
    } catch (err) {
      logger.error(`Exception in getTableColumns for ${tableName}:`, { data: err });
      return [];
    } finally {
      timer.stop();
    }
  },

  /**
   * Records a sync error in the database
   * @param mappingId The mapping ID
   * @param errorType The type of error
   * @param errorMessage The error message
   * @param recordData Optional record data
   * @param retryable Whether the error is retryable
   */
  async recordSyncError(
    mappingId: string,
    errorType: string, 
    errorMessage: string, 
    recordData?: any,
    retryable = false
  ): Promise<void> {
    const timer = logger.timer('recordSyncError');
    logger.info(`Recording sync error for mapping ${mappingId}`, {
      data: { errorType, errorMessage, retryable }
    });
    
    try {
      await supabase.rpc('gl_record_sync_error', {
        p_mapping_id: mappingId,
        p_error_type: errorType,
        p_error_message: errorMessage,
        p_record_data: recordData,
        p_retryable: retryable
      });
      
      logger.info(`Error recorded successfully`);
    } catch (error) {
      logger.error('Error recording sync error:', { data: error });
    } finally {
      timer.stop();
    }
  },

  /**
   * Validates column mappings for a record
   * @param record The record to validate
   * @param columnMappings The column mappings
   * @param mappingId The mapping ID for error recording
   * @returns Whether the validation passed
   */
  validateColumnMappings(
    record: Record<string, any>,
    columnMappings: Record<string, any>,
    mappingId: string
  ): boolean {
    logger.debug(`Validating column mappings`, {
      data: { recordId: record.id || record.glide_row_id }
    });
    
    // Basic validation of required fields
    if (!record.glide_row_id) {
      this.recordSyncError(
        mappingId,
        'VALIDATION_ERROR',
        'Missing required glide_row_id',
        { record }
      );
      logger.warn(`Validation failed: Missing required glide_row_id`);
      return false;
    }

    logger.debug(`Validation passed`);
    return true;
  },

  /**
   * Updates a sync log entry
   * @param logId The log ID
   * @param status The status
   * @param message The message
   * @param recordsProcessed Optional records processed count
   */
  async updateSyncLog(
    logId: string,
    status: string,
    message: string,
    recordsProcessed?: number
  ): Promise<void> {
    const timer = logger.timer('updateSyncLog');
    logger.info(`Updating sync log ${logId}`, {
      data: { status, message, recordsProcessed }
    });
    
    try {
      const updateData: any = {
        status,
        message,
      };
      
      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      if (recordsProcessed !== undefined) {
        updateData.records_processed = recordsProcessed;
      }

      const { error } = await supabase
        .from('gl_sync_logs')
        .update(updateData)
        .eq('id', logId);
        
      if (error) {
        logger.error(`Error updating sync log:`, { data: error });
      } else {
        logger.info(`Sync log updated successfully`);
      }
    } catch (err) {
      logger.error(`Exception in updateSyncLog:`, { data: err });
    } finally {
      timer.stop();
    }
  },

  /**
   * Creates a new sync log entry
   * @param mappingId The mapping ID
   * @param status The status
   * @param message The message
   * @returns The log ID
   */
  async createSyncLog(
    mappingId: string,
    status: string,
    message: string
  ): Promise<string | null> {
    const timer = logger.timer('createSyncLog');
    logger.info(`Creating sync log for mapping ${mappingId}`, {
      data: { status, message }
    });
    
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .insert({
          mapping_id: mappingId,
          status,
          message
        })
        .select('id')
        .single();

      if (error) {
        logger.error(`Failed to create sync log:`, { data: error });
        return null;
      }
      
      logger.info(`Sync log created with ID ${data.id}`);
      return data.id;
    } catch (err) {
      logger.error(`Exception in createSyncLog:`, { data: err });
      return null;
    } finally {
      timer.stop();
    }
  },

  /**
   * Gets the columns for a Supabase table
   * 
   * @param tableName - The name of the table to get columns for
   * @returns A promise that resolves to an array of column objects
   * 
   * @example
   * // Get columns for the gl_invoices table
   * const columns = await glSyncService.getSupabaseTableColumns('gl_invoices');
   */
  async getSupabaseTableColumns(tableName: string): Promise<{ column_name: string; data_type: string }[]> {
    const timer = logger.timer('getSupabaseTableColumns');
    logger.info(`Getting columns for table ${tableName}`);
    
    try {
      // Execute a SQL query to get table columns
      const { data, error } = await supabase.rpc('get_table_columns', { 
        table_name: tableName 
      });
        
      if (error) {
        logger.error(`Error getting columns for table ${tableName}:`, { data: error });
        return [];
      }
      
      logger.info(`Retrieved ${data?.length || 0} columns for table ${tableName}`);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Exception in getSupabaseTableColumns: ${errorMessage}`, { data: err });
      return [];
    } finally {
      timer.stop();
    }
  },
};

// For backward compatibility, export individual functions
export const {
  testConnection,
  listGlideTables,
  syncData,
  getColumnMappings,
  validateMapping,
  mapAllRelationships,
  validateRelationships,
  recordSyncError,
  validateColumnMappings,
  updateSyncLog,
  createSyncLog
} = glSyncService;
