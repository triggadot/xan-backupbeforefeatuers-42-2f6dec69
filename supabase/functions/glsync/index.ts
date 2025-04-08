import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { testGlideConnection, getGlideTableColumns } from '../shared/glide-api.ts'

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service role key is not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const requestBody = await req.json();
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
    else {
      throw new Error(`Unknown action: ${action}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function testGlideConnectionHandler(supabase, connectionId: string) {
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
  } catch (error) {
    console.error('Connection test failed:', error);
    
    // Update connection status to error
    await supabase
      .from('gl_connections')
      .update({ status: 'error' })
      .eq('id', connectionId);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
}

async function getGlideColumnMappings(supabase, connectionId: string, tableId: string) {
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
  } catch (error) {
    console.error('Error getting column mappings:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
}

async function syncData(supabase, connectionId: string, mappingId: string) {
  console.log(`Starting sync for mapping: ${mappingId}`);
  
  // Create a sync log entry
  const { data: logEntry, error: logError } = await supabase
    .from('gl_sync_logs')
    .insert({
      mapping_id: mappingId,
      status: 'started',
      message: 'Sync started'
    })
    .select()
    .single();
  
  if (logError) {
    console.error('Error creating sync log:', logError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to create sync log entry' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
  
  const logId = logEntry.id;
  console.log(`Created sync log with ID: ${logId}`);
  
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
    
    // Update log to processing
    await supabase
      .from('gl_sync_logs')
      .update({
        status: 'processing',
        message: 'Fetching data from Glide'
      })
      .eq('id', logId);
    
    // Fetch data from Glide
    const glideResponse = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appID: connection.app_id,
        queries: [
          { 
            tableName: mapping.glide_table,
            limit: 10000
          }
        ]
      })
    });
    
    if (!glideResponse.ok) {
      const errorText = await glideResponse.text();
      throw new Error(`Glide API returned: ${glideResponse.status} - ${errorText}`);
    }
    
    const glideData = await glideResponse.json();
    console.log('Glide API response:', JSON.stringify(glideData, null, 2));
    
    const tableData = glideData[0];
    
    if (!tableData || !tableData.rows) {
      throw new Error('No data returned from Glide API');
    }
    
    // Log first row for debugging
    if (tableData.rows.length > 0) {
      console.log('First row sample:', JSON.stringify(tableData.rows[0], null, 2));
      console.log('Column mappings:', JSON.stringify(mapping.column_mappings, null, 2));
    }
    
    // Update log with progress
    await supabase
      .from('gl_sync_logs')
      .update({
        status: 'processing',
        message: `Processing ${tableData.rows.length} records`,
        records_processed: 0
      })
      .eq('id', logId);
    
    // Process and transform the data for Supabase
    const columnMappings = mapping.column_mappings;
    const transformedRows = [];
    const errors: Array<{
      type: string;
      message: string;
      record?: any;
      batch_index?: number;
      retryable: boolean;
    }> = [];
    
    for (const glideRow of tableData.rows) {
      try {
        const supabaseRow: Record<string, any> = {};
        
        // Always map glide_row_id
        supabaseRow.glide_row_id = glideRow.$rowID;
        
        // Map other columns according to mapping
        for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
          if (glideColumnId === '$rowID') continue; // Already handled
          
          const { glide_column_name, supabase_column_name, data_type } = mappingInfo as any;
          const glideValue = glideRow[glide_column_name];
          
          if (glideValue !== undefined) {
            supabaseRow[supabase_column_name] = transformValue(glideValue, data_type);
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
          message: error.message,
          record: glideRow,
          retryable: false
        });
        
        // Log error to database
        await supabase.rpc('gl_record_sync_error', {
          p_mapping_id: mappingId,
          p_error_type: 'TRANSFORM_ERROR',
          p_error_message: error.message,
          p_record_data: glideRow,
          p_retryable: false
        });
      }
    }
    
    console.log(`Transformed ${transformedRows.length} rows`);
    
    // Insert/update the data in Supabase (upsert)
    if (transformedRows.length > 0) {
      // Update log with progress
      await supabase
        .from('gl_sync_logs')
        .update({
          message: `Inserting ${transformedRows.length} records into Supabase`,
        })
        .eq('id', logId);
      
      // Use batching to avoid hitting limits
      const batchSize = 100;
      let recordsProcessed = 0;
      
      for (let i = 0; i < transformedRows.length; i += batchSize) {
        const batch = transformedRows.slice(i, i + batchSize);
        
        let upsertError: Error | null = null;
        
        // Special handling for gl_estimate_lines table to use our custom glsync function
        if (mapping.supabase_table === 'gl_estimate_lines') {
          console.log('Using permission-safe glsync function for estimate lines');
          
          try {
            // Use our permission-safe sync function for estimate lines
            const { data: syncResult, error: syncError } = await supabase.rpc('glsync_estimate_lines_safe', {
              data: batch
            });
            
            if (syncError) {
              throw syncError;
            }
            
            // Log sync results
            if (syncResult) {
              console.log(`Estimate lines sync results: Inserted ${syncResult.inserted?.length || 0}, Updated ${syncResult.updated?.length || 0}, Errors ${syncResult.errors?.length || 0}`);
              
              // If there were errors, log them but continue processing
              if (syncResult.errors && syncResult.errors.length > 0) {
                console.warn('Some estimate lines had errors:', syncResult.errors);
              }
            }
          } catch (err) {
            upsertError = err as Error;
          }
        } else {
          // Standard upsert for other tables
          const { error } = await supabase
            .from(mapping.supabase_table)
            .upsert(batch, { 
              onConflict: 'glide_row_id',
              ignoreDuplicates: false
            });
          
          upsertError = error;
        }
        
        if (upsertError) {
          console.error('Error upserting data:', upsertError);
          
          // Log error to database
          await supabase.rpc('gl_record_sync_error', {
            p_mapping_id: mappingId,
            p_error_type: 'DATABASE_ERROR',
            p_error_message: typeof upsertError === 'object' && upsertError !== null && 'message' in upsertError 
              ? String(upsertError.message) 
              : String(upsertError),
            p_record_data: { batch_index: i, batch_size: batch.length },
            p_retryable: true
          });
          
          errors.push({
            type: 'DATABASE_ERROR',
            message: typeof upsertError === 'object' && upsertError !== null && 'message' in upsertError 
              ? String(upsertError.message) 
              : String(upsertError),
            batch_index: i,
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
  } catch (error) {
    console.error('Error during sync:', error);
    
    // Update sync log with error
    await supabase
      .from('gl_sync_logs')
      .update({
        status: 'failed',
        message: `Sync failed: ${error.message}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', logId);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
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
