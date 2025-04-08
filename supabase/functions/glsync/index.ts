// Use the correct import URL for Supabase JS client in Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { testGlideConnection, getGlideTableColumns, fetchGlideTableData } from '../shared/glide-api'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GlConnection {
  id: string;
  app_id: string;
  api_key: string;
  app_name: string | null;
}

interface GlMapping {
  id: string;
  connection_id: string;
  glide_table: string;
  supabase_table: string;
  column_mappings: Record<string, {
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>;
  sync_direction: 'to_supabase' | 'to_glide' | 'both';
}

interface SyncRequestBody {
  action: string;
  connectionId: string;
  mappingId: string;
  tableId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = await Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = await Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service role key is not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const requestBody = await req.json() as SyncRequestBody;
    const { action, connectionId, mappingId, tableId } = requestBody;

    console.log(`Processing ${action} action for connection ${connectionId}`);
    
    if (!action) {
      throw new Error('Action is required');
    }
    
    if (action === 'testConnection') {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }
      
      return await testGlideConnectionHandler(supabase, connectionId);
    } 
    else if (action === 'getTableNames') {
      // Return existing Glide tables from gl_mappings
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('glide_table, glide_table_display_name')
        .order('glide_table_display_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Format the response to match expected structure
      const uniqueTables = new Map();
      
      // Filter unique tables to avoid duplicates
      data.forEach(item => {
        // Only add if not already in map
        if (!uniqueTables.has(item.glide_table)) {
          uniqueTables.set(item.glide_table, {
            id: item.glide_table,
            display_name: item.glide_table_display_name
          });
        }
      });
      
      const tables = Array.from(uniqueTables.values());
      
      return new Response(
        JSON.stringify({ 
          success: true,
          tables 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    else if (action === 'getColumnMappings') {
      if (!connectionId || !tableId) {
        throw new Error('Connection ID and Table ID are required');
      }
      
      return await getGlideColumnMappings(supabase, connectionId, tableId);
    }
    else if (action === 'syncData') {
      if (!connectionId || !mappingId) {
        throw new Error('Connection ID and Mapping ID are required');
      }
      
      return await syncData(supabase, connectionId, mappingId);
    }
    else if (action === 'syncMapping') {
      if (!mappingId) {
        throw new Error('Mapping ID is required');
      }
      
      // Get the connection ID from the mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('connection_id')
        .eq('id', mappingId)
        .single();
      
      if (mappingError) {
        throw mappingError;
      }
      
      if (!mapping) {
        throw new Error('Mapping not found');
      }
      
      // Call syncData with the retrieved connection ID
      return await syncData(supabase, mapping.connection_id, mappingId);
    }
    else {
      throw new Error(`Unknown action: ${action}`);
    }
    
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function testGlideConnectionHandler(supabase: any, connectionId: string) {
  console.log(`Testing connection with ID: ${connectionId}`);
  
  try {
    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    
    if (connectionError) {
      throw connectionError;
    }
    
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    // Test the connection by fetching app data from Glide API
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appID: connection.app_id,
        queries: [
          { 
            tableName: connection.glide_table,
            limit: 10000
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    // Update connection status to active
    await supabase
      .from('gl_connections')
      .update({ status: 'active' })
      .eq('id', connectionId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Connection successful' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: unknown) {
    console.error('Connection test failed:', error instanceof Error ? error.message : String(error));
    
    // Update connection status to error
    await supabase
      .from('gl_connections')
      .update({ status: 'error' })
      .eq('id', connectionId);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
}

async function getGlideColumnMappings(supabase: any, connectionId: string, tableId: string) {
  console.log(`Getting column mappings for table: ${tableId}`);
  
  try {
    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    
    if (connectionError) {
      throw connectionError;
    }
    
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    const columns = await getGlideTableColumns(connection.api_key, connection.app_id, tableId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        columns 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: unknown) {
    console.error('Error getting column mappings:', error instanceof Error ? error.message : String(error));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
}

async function syncData(supabase: any, connectionId: string, mappingId: string) {
  console.log(`Syncing data for mapping: ${mappingId}`);
  
  // Create a sync log entry
  const { data: logData, error: logError } = await supabase
    .from('gl_sync_logs')
    .insert({
      mapping_id: mappingId,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (logError) {
    console.error('Error creating sync log:', logError);
  }
  
  // Store the log ID for later updates
  const logId = logData?.id;
  
  try {
    // Get mapping details
    const { data: mapping, error: mappingError } = await supabase
      .from('gl_mappings')
      .select('*')
      .eq('id', mappingId)
      .single();
    
    if (mappingError) {
      throw mappingError;
    }
    
    if (!mapping) {
      throw new Error('Mapping not found');
    }
    
    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    
    if (connectionError) {
      throw connectionError;
    }
    
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    console.log(`Fetching data from Glide API for table: ${mapping.glide_table}`);
    
    // Initialize variables for pagination
    let allRows: Record<string, any>[] = [];
    let continuationToken: string | null = null;
    let hasMoreData = true;
    
    // Update log to fetching status
    await supabase
      .from('gl_sync_logs')
      .update({
        status: 'processing',
        message: 'Fetching data from Glide'
      })
      .eq('id', logId);
    
    // Fetch data with pagination
    while (hasMoreData) {
      const result = await fetchGlideTableData(
        connection.api_key,
        connection.app_id,
        mapping.glide_table,
        continuationToken
      );
      
      if (result.error) {
        throw new Error(`Error fetching data from Glide: ${result.error}`);
      }
      
      if (result.rows && result.rows.length > 0) {
        allRows = [...allRows, ...result.rows];
        
        // Update log with progress
        await supabase
          .from('gl_sync_logs')
          .update({
            message: `Fetched ${allRows.length} records from Glide`
          })
          .eq('id', logId);
      }
      
      // Check if we have more data to fetch
      if (result.next) {
        continuationToken = result.next;
        console.log(`Continuing pagination with token: ${continuationToken}`);
      } else {
        hasMoreData = false;
      }
      
      // Safety check to prevent infinite loops
      if (allRows.length > 100000) {
        console.warn('Reached safety limit of 100,000 records');
        hasMoreData = false;
      }
    }
    
    console.log(`Total rows fetched from Glide: ${allRows.length}`);
    
    if (allRows.length === 0) {
      console.log('No data returned from Glide API');
      
      // Update sync log
      await supabase
        .from('gl_sync_logs')
        .update({
          status: 'completed',
          message: 'No data to sync',
          completed_at: new Date().toISOString()
        })
        .eq('id', logId);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          recordsProcessed: 0,
          message: 'No data to sync'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Process and transform the data for Supabase
    const columnMappings = mapping.column_mappings;
    
    // Debug logging for column mappings
    console.log('Column mappings type:', typeof columnMappings);
    console.log('Column mappings structure:', JSON.stringify(columnMappings, null, 2));
    
    // Validate column mappings structure
    if (!columnMappings || typeof columnMappings !== 'object') {
      console.error('Invalid column_mappings format:', columnMappings);
      throw new Error(`Invalid column_mappings format for mapping ${mappingId}. Expected object, got ${typeof columnMappings}`);
    }
    
    // Check if required $rowID mapping exists
    if (!columnMappings.$rowID) {
      console.error('Missing required $rowID mapping:', columnMappings);
      throw new Error(`Missing required $rowID mapping for mapping ${mappingId}`);
    }
    
    // Validate and normalize column mappings
    const validatedMappings = validateAndFixColumnMappings(columnMappings);
    console.log('Validated mappings:', JSON.stringify(validatedMappings, null, 2));
    
    const transformedRows = [];
    const errors: Array<{
      type: string;
      message: string;
      record?: any;
      batch_index?: number;
      retryable: boolean;
    }> = [];
    
    for (const glideRow of allRows) {
      try {
        const supabaseRow: Record<string, any> = {};
        
        // Always map glide_row_id
        supabaseRow.glide_row_id = glideRow.$rowID;
        
        // Debug: Log the first row structure
        if (transformedRows.length === 0) {
          console.log('Sample Glide row structure:', JSON.stringify(glideRow, null, 2));
        }
        
        // Map other columns according to mapping
        for (const [glideColumnId, mappingInfo] of Object.entries(validatedMappings)) {
          if (glideColumnId === '$rowID') continue; // Already handled
          
          const { glide_column_name, supabase_column_name, data_type } = mappingInfo as any;
          
          // Debug: Log mapping details for the first row
          if (transformedRows.length === 0) {
            console.log(`Mapping: ${glideColumnId} -> ${supabase_column_name} (${data_type})`);
            console.log(`Glide value by ID exists: ${glideRow[glideColumnId] !== undefined}`);
            console.log(`Glide value by name exists: ${glideRow[glide_column_name] !== undefined}`);
            
            if (glideRow[glideColumnId] !== undefined) {
              console.log(`Glide value by ID: ${JSON.stringify(glideRow[glideColumnId])}`);
            } else if (glideRow[glide_column_name] !== undefined) {
              console.log(`Glide value by name: ${JSON.stringify(glideRow[glide_column_name])}`);
            }
          }
          
          // Try to get the value using the column ID first, then fall back to the column name
          let glideValue = glideRow[glideColumnId];
          
          // If the value is undefined, try using the glide_column_name instead
          if (glideValue === undefined && glide_column_name) {
            glideValue = glideRow[glide_column_name];
            
            // Log when we're falling back to using the column name
            if (glideValue !== undefined && transformedRows.length === 0) {
              console.log(`Using column name fallback for ${glideColumnId} -> ${glide_column_name}`);
            }
          }
          
          if (glideValue !== undefined) {
            try {
              supabaseRow[supabase_column_name] = transformValue(glideValue, data_type);
            } catch (err: any) {
              const transformError = err instanceof Error ? err : new Error(String(err));
              console.error(`Error transforming value for ${supabase_column_name}:`, {
                glideColumnId,
                glideValue,
                data_type,
                error: transformError.message
              });
              
              // Add to errors but continue processing other fields
              errors.push({
                type: 'TRANSFORM_ERROR',
                message: `Error transforming ${glideColumnId} to ${supabase_column_name}: ${transformError.message}`,
                record: { glide_row_id: glideRow.$rowID },
                retryable: true
              });
              
              // Use null for the value that failed transformation
              supabaseRow[supabase_column_name] = null;
            }
          }
        }
        
        // Debug logging for the first few rows
        if (transformedRows.length < 3) {
          console.log(`Transformed row ${transformedRows.length}:`, JSON.stringify(supabaseRow, null, 2));
        }
        
        transformedRows.push(supabaseRow);
      } catch (error) {
        console.error('Error transforming row:', error);
        errors.push({
          type: 'TRANSFORM_ERROR',
          message: error instanceof Error ? error.message : String(error),
          record: glideRow,
          retryable: false
        });
        
        // Log error to database
        await supabase.rpc('gl_record_sync_error', {
          p_mapping_id: mappingId,
          p_error_type: 'TRANSFORM_ERROR',
          p_error_message: error instanceof Error ? error.message : String(error),
          p_record_data: glideRow,
          p_retryable: false
        });
      }
    }
    
    console.log(`Transformed ${transformedRows.length} rows`);
    
    // Batch upsert to Supabase
    const batchSize = 100;
    let recordsProcessed = 0;
    
    // Insert/update the data in Supabase (upsert)
    if (transformedRows.length > 0) {
      // Update log with progress
      await supabase
        .from('gl_sync_logs')
        .update({
          message: `Inserting ${transformedRows.length} records into Supabase`,
        })
        .eq('id', logId);
    
      for (let i = 0; i < transformedRows.length; i += batchSize) {
        const batch = transformedRows.slice(i, i + batchSize);
        
        console.log(`Upserting batch ${i / batchSize + 1} of ${Math.ceil(transformedRows.length / batchSize)}, size: ${batch.length}`);
        
        // Debug: Log the first batch
        if (i === 0) {
          console.log('First batch sample:', JSON.stringify(batch[0], null, 2));
        }
        
        try {
          // Temporarily disable triggers to prevent interference during sync
          await supabase.rpc('set_session_replication_role', { role: 'replica' });
          
          const { error } = await supabase
            .from(mapping.supabase_table)
            .upsert(batch, { 
              onConflict: 'glide_row_id',
              ignoreDuplicates: false
            });
          
          // Re-enable triggers after sync
          await supabase.rpc('reset_session_replication_role');
          
          if (error) {
            console.error('Error upserting data:', error);
            
            // Log error to database
            await supabase.rpc('gl_record_sync_error', {
              p_mapping_id: mappingId,
              p_error_type: 'DATABASE_ERROR',
              p_error_message: error.message,
              p_record_data: { batch_index: i, batch_size: batch.length },
              p_retryable: true
            });
            
            errors.push({
              type: 'DATABASE_ERROR',
              message: error.message,
              batch_index: i / batchSize + 1,
              retryable: true
            });
          } else {
            recordsProcessed += batch.length;
            
            // Update log with progress
            await supabase
              .from('gl_sync_logs')
              .update({
                records_processed: recordsProcessed
              })
              .eq('id', logId);
          }
        } catch (err: any) {
          console.error('Unexpected error during upsert:', err);
          errors.push({
            type: 'DATABASE_ERROR',
            message: err.message || 'Unknown error',
            batch_index: i / batchSize + 1,
            retryable: true
          });
        }
      }
    }
    
    // Finalize sync log
    await supabase
      .from('gl_sync_logs')
      .update({
        status: errors.length > 0 ? 'completed_with_errors' : 'completed',
        message: `Sync completed. Processed ${transformedRows.length} records with ${errors.length} errors.`,
        records_processed: transformedRows.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', logId);
    
    // Update connection's last_sync timestamp
    await supabase
      .from('gl_connections')
      .update({ 
        last_sync: new Date().toISOString() 
      })
      .eq('id', connectionId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        recordsProcessed: transformedRows.length,
        failedRecords: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: unknown) {
    console.error('Error during sync:', error instanceof Error ? error.message : String(error));
    
    // Update sync log with error
    await supabase
      .from('gl_sync_logs')
      .update({
        status: 'failed',
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', logId);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
}

function validateAndFixColumnMappings(columnMappings: Record<string, any>): Record<string, any> {
  const validatedMappings: Record<string, any> = {};
  
  for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
    if (typeof mappingInfo !== 'object') {
      console.error(`Invalid mapping format for ${glideColumnId}: ${JSON.stringify(mappingInfo)}`);
      continue;
    }
    
    const { glide_column_name, supabase_column_name, data_type } = mappingInfo;
    
    if (!glide_column_name || !supabase_column_name || !data_type) {
      console.error(`Missing required fields for ${glideColumnId}: ${JSON.stringify(mappingInfo)}`);
      continue;
    }
    
    validatedMappings[glideColumnId] = {
      glide_column_name,
      supabase_column_name,
      data_type
    };
  }
  
  return validatedMappings;
}

function transformValue(value: any, dataType: string): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  switch (dataType) {
    case 'string':
    case 'email-address':
    case 'image-uri':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'date-time':
      // If it's already a valid date string, return it
      if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        return value;
      }
      // If it's a number (timestamp), convert to ISO string
      if (typeof value === 'number') {
        return new Date(value).toISOString();
      }
      return null;
    default:
      return String(value);
  }
}
