
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { testGlideConnection, getGlideTableColumns, fetchGlideTableData, updateGlideData } from '../shared/glide-api.ts'

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
      
      return await testGlideConnection(supabase, connectionId);
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
      (data || []).forEach(item => {
        // Only add if not already in map
        if (!uniqueTables.has(item.glide_table)) {
          uniqueTables.set(item.glide_table, {
            id: item.glide_table,
            display_name: item.glide_table_display_name || item.glide_table
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
      if (!connectionId && !mappingId) {
        throw new Error('Either Connection ID or Mapping ID is required');
      }
      
      return await syncData(supabase, connectionId, mappingId);
    }
    else if (action === 'syncAccounts') {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }
      
      // Find mapping ID for gl_accounts table
      const { data: mappings, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('id')
        .eq('supabase_table', 'gl_accounts')
        .order('created_at', { ascending: false });
      
      if (mappingError) {
        throw new Error('Error finding mapping for accounts table: ' + mappingError.message);
      }
      
      if (!mappings || mappings.length === 0) {
        throw new Error('No mapping found for accounts table');
      }
      
      // Use the most recently created mapping
      const mappingId = mappings[0].id;
      console.log(`Using mapping ID ${mappingId} for accounts table`);
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

async function getGlideColumnMappings(supabase, connectionId: string, tableId: string) {
  console.log(`Getting column mappings for table: ${tableId}`);
  
  try {
    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();
    
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
    .select();
  
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
  
  if (!logEntry || logEntry.length === 0) {
    console.error('No log entry was created');
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
  
  const logId = logEntry[0].id;
  console.log(`Created sync log with ID: ${logId}`);
  
  try {
    // Get connection details
    let connection: GlConnection;
    
    if (connectionId) {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', connectionId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Connection not found');
      
      connection = data;
    } else {
      // If connectionId not provided, get it from the mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('connection_id')
        .eq('id', mappingId)
        .maybeSingle();
      
      if (mappingError) throw mappingError;
      if (!mapping) throw new Error('Mapping not found');
      
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', mapping.connection_id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Connection not found');
      
      connection = data;
      connectionId = connection.id;
    }
    
    // Get mapping details
    const { data: mapping, error: mappingError } = await supabase
      .from('gl_mappings')
      .select('*')
      .eq('id', mappingId)
      .maybeSingle();
    
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
    const { rows: glideRows, columns: glideColumns } = await fetchGlideTableData(
      connection.api_key, 
      connection.app_id, 
      mapping.glide_table,
      10000
    );
    
    if (!glideRows || glideRows.length === 0) {
      await supabase
        .from('gl_sync_logs')
        .update({
          status: 'completed',
          message: 'No data found in Glide',
          completed_at: new Date().toISOString()
        })
        .eq('id', logId);
        
      return new Response(
        JSON.stringify({ 
          success: true,
          recordsProcessed: 0,
          failedRecords: 0,
          message: 'No data found in Glide'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Update log with progress
    await supabase
      .from('gl_sync_logs')
      .update({
        status: 'processing',
        message: `Processing ${glideRows.length} records`,
        records_processed: 0
      })
      .eq('id', logId);
    
    // Parse column mappings - handle both string and object formats
    let columnMappings = mapping.column_mappings;
    if (typeof columnMappings === 'string') {
      try {
        columnMappings = JSON.parse(columnMappings);
      } catch (e) {
        console.error('Error parsing column mappings:', e);
        throw new Error('Invalid column mapping format');
      }
    }
    
    const transformedRows = [];
    const errors = [];
    
    // Special handling for the accounts table to ensure required fields
    const isAccountsTable = mapping.supabase_table === 'gl_accounts';
    
    for (const glideRow of glideRows) {
      try {
        const supabaseRow = {};
        
        // Always map glide_row_id
        supabaseRow.glide_row_id = glideRow.$rowID;
        
        // Map other columns according to mapping
        for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
          if (glideColumnId === '$rowID') continue; // Already handled
          
          const glideValue = glideRow[glideColumnId];
          const supabaseColumnName = mappingInfo.supabase_column_name;
          const dataType = mappingInfo.data_type;
          
          supabaseRow[supabaseColumnName] = transformValue(glideValue, dataType);
        }
        
        // Special handling for accounts table
        if (isAccountsTable) {
          // Generate an accounts_uid if not present
          if (!supabaseRow.accounts_uid) {
            supabaseRow.accounts_uid = `ACC${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
          }
          
          // Ensure client_type is valid - use the normalized value
          if (supabaseRow.client_type) {
            // Normalize client_type to match the constraint
            const normalizedClientType = normalizeClientType(supabaseRow.client_type);
            supabaseRow.client_type = normalizedClientType;
          }
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
    
    console.log(`Transformed ${transformedRows.length} rows for table ${mapping.supabase_table}`);
    
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
        
        // Perform upsert operation
        const { error: upsertError } = await supabase
          .from(mapping.supabase_table)
          .upsert(batch, { 
            onConflict: 'glide_row_id',
            ignoreDuplicates: false
          });
        
        if (upsertError) {
          console.error('Error upserting data:', upsertError);
          
          // Log error to database
          await supabase.rpc('gl_record_sync_error', {
            p_mapping_id: mappingId,
            p_error_type: 'DATABASE_ERROR',
            p_error_message: upsertError.message,
            p_record_data: { batch_index: i, batch_size: batch.length },
            p_retryable: true
          });
          
          errors.push({
            type: 'DATABASE_ERROR',
            message: upsertError.message,
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

// Helper function to normalize client type values
function normalizeClientType(clientType: string | null | undefined): string | null {
  if (!clientType) return null;
  
  // Normalize to match the exact values expected by the constraint
  const normalized = String(clientType).trim().toLowerCase();
  
  if (/customer\s*&\s*vendor/i.test(normalized) || 
      /customer\s+and\s+vendor/i.test(normalized) ||
      /both/i.test(normalized)) {
    return 'Customer & Vendor';
  } else if (/vendor/i.test(normalized)) {
    return 'Vendor';
  } else if (/customer/i.test(normalized)) {
    return 'Customer';
  }
  
  // If we can't determine the type, default to Customer
  return 'Customer';
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
