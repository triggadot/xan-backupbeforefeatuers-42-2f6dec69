
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { action, connectionId, mappingId, ...rest } = await req.json();
    
    console.log(`Processing ${action} action for connection ${connectionId}`);

    // Process different actions
    switch (action) {
      case 'testConnection':
        return await testConnection(supabase, connectionId);
      
      case 'getTableNames':
        return await getGlideTables(supabase, connectionId);
      
      case 'getColumnMappings':
        return await getGlideTableColumns(supabase, connectionId, rest.tableId);
      
      case 'validateMapping':
        return await validateMapping(supabase, mappingId);
      
      case 'syncData':
        return await syncData(supabase, connectionId, mappingId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to allow frontend to handle the error
      }
    );
  }
});

// Test connection to Glide
async function testConnection(supabase, connectionId) {
  try {
    // Fetch connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();
    
    if (connectionError) throw connectionError;
    if (!connection) throw new Error('Connection not found');
    
    // Test connection by making a simple request to Glide API
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appID: connection.app_id,
        queries: [{ limit: 1 }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    // Update connection status
    await supabase
      .from('gl_connections')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Connection successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error testing connection:', error);
    
    // Update connection status to reflect error
    try {
      await supabase
        .from('gl_connections')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
    } catch (updateError) {
      console.error('Error updating connection status:', updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to test connection'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get list of Glide tables
async function getGlideTables(supabase, connectionId) {
  try {
    // Fetch connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();
    
    if (connectionError) throw connectionError;
    if (!connection) throw new Error('Connection not found');
    
    // Fetch tables from Glide API
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appID: connection.app_id,
        queries: [{ limit: 1 }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract table names from response
    const tables = data.map(table => ({
      id: table.tableName,
      name: table.displayName || table.tableName
    }));
    
    return new Response(
      JSON.stringify({ success: true, tables }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Glide tables:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch Glide tables'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get columns for a specific Glide table
async function getGlideTableColumns(supabase, connectionId, tableId) {
  try {
    if (!tableId) throw new Error('Table ID is required');
    
    // Fetch connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();
    
    if (connectionError) throw connectionError;
    if (!connection) throw new Error('Connection not found');
    
    // Fetch table schema from Glide API
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
            tableName: tableId,
            limit: 1
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Check if we have columns data
    if (!data || !data[0] || !data[0].columns) {
      throw new Error('No columns found in Glide table');
    }
    
    // Format columns for display
    const columns = Object.entries(data[0].columns).map(([id, info]) => ({
      id,
      name: info.name,
      type: info.type || 'string'
    }));
    
    return new Response(
      JSON.stringify({ success: true, columns }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Glide table columns:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch Glide table columns'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Validate mapping
async function validateMapping(supabase, mappingId) {
  try {
    if (!mappingId) throw new Error('Mapping ID is required');
    
    // Call the database function to validate the mapping
    const { data, error } = await supabase
      .rpc('gl_validate_column_mapping', { 
        p_mapping_id: mappingId
      });
    
    if (error) throw error;
    
    if (!data || !data[0]) {
      throw new Error('No validation result returned');
    }
    
    const result = data[0];
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        isValid: result.is_valid,
        message: result.validation_message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating mapping:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to validate mapping'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Sync data between Glide and Supabase
async function syncData(supabase, connectionId, mappingId) {
  let syncLogId = null;
  
  try {
    // Determine what to sync
    let mappingsToSync = [];
    
    if (mappingId) {
      // Fetch specific mapping
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*, gl_connections(*)')
        .eq('id', mappingId)
        .eq('enabled', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error(`Mapping not found or disabled: ${mappingId}`);
      
      mappingsToSync = [data];
    } else if (connectionId) {
      // Fetch all enabled mappings for the connection
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*, gl_connections(*)')
        .eq('connection_id', connectionId)
        .eq('enabled', true);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`No enabled mappings found for connection: ${connectionId}`);
      }
      
      mappingsToSync = data;
    } else {
      throw new Error('Either connectionId or mappingId is required');
    }
    
    console.log(`Found ${mappingsToSync.length} mappings to sync`);
    
    // Process each mapping
    let totalRecordsProcessed = 0;
    let failedRecords = 0;
    
    for (const mapping of mappingsToSync) {
      // Create sync log entry
      const { data: logData, error: logError } = await supabase
        .from('gl_sync_logs')
        .insert({
          mapping_id: mapping.id,
          status: 'started',
          message: `Starting sync for ${mapping.glide_table_display_name || mapping.glide_table}`,
        })
        .select()
        .single();
      
      if (logError) throw logError;
      syncLogId = logData.id;
      
      console.log(`Created sync log with ID: ${syncLogId}`);
      
      try {
        // Get connection details
        const connection = mapping.gl_connections;
        if (!connection) throw new Error('Connection not found');
        
        // Validate data types and mapping
        const { data: validationData, error: validationError } = await supabase
          .rpc('gl_validate_column_mapping', { p_mapping_id: mapping.id });
        
        if (validationError) throw validationError;
        
        const validationResult = validationData[0];
        if (!validationResult.is_valid) {
          throw new Error(`Invalid mapping: ${validationResult.validation_message}`);
        }
        
        // Process based on sync direction
        let recordsProcessed = 0;
        let errors = 0;
        const columnMappings = typeof mapping.column_mappings === 'string' 
          ? JSON.parse(mapping.column_mappings) 
          : mapping.column_mappings;
        
        // Update sync log with processing status
        await supabase
          .from('gl_sync_logs')
          .update({
            status: 'processing',
            message: `Processing ${mapping.glide_table_display_name || mapping.glide_table}`,
          })
          .eq('id', syncLogId);
        
        if (mapping.sync_direction === 'to_supabase' || mapping.sync_direction === 'both') {
          // Sync from Glide to Supabase
          const glideData = await fetchGlideData(
            connection.api_key,
            connection.app_id,
            mapping.glide_table
          );
          
          if (glideData.rows.length > 0) {
            const results = await syncGlideToSupabase(
              supabase,
              mapping.supabase_table,
              glideData.rows,
              columnMappings
            );
            
            recordsProcessed += results.processed;
            errors += results.errors;
          }
        }
        
        if (mapping.sync_direction === 'to_glide' || mapping.sync_direction === 'both') {
          // Sync from Supabase to Glide
          const { data: supabaseData, error: supabaseError } = await supabase
            .from(mapping.supabase_table)
            .select('*')
            .limit(10000);
          
          if (supabaseError) throw supabaseError;
          
          if (supabaseData.length > 0) {
            const results = await syncSupabaseToGlide(
              connection.api_key,
              connection.app_id,
              mapping.glide_table,
              supabaseData,
              columnMappings
            );
            
            recordsProcessed += results.processed;
            errors += results.errors;
          }
        }
        
        // Update sync log with completed status
        await supabase
          .from('gl_sync_logs')
          .update({
            completed_at: new Date().toISOString(),
            status: errors > 0 ? 'completed_with_errors' : 'completed',
            records_processed: recordsProcessed,
            message: `Processed ${recordsProcessed} records with ${errors} errors`,
          })
          .eq('id', syncLogId);
        
        totalRecordsProcessed += recordsProcessed;
        failedRecords += errors;
        
      } catch (error) {
        console.error(`Error syncing mapping ${mapping.id}:`, error);
        
        // Update sync log with error status
        await supabase
          .from('gl_sync_logs')
          .update({
            completed_at: new Date().toISOString(),
            status: 'failed',
            message: `Error: ${error.message}`,
          })
          .eq('id', syncLogId);
        
        // Record error
        await supabase
          .from('gl_sync_errors')
          .insert({
            mapping_id: mapping.id,
            error_type: 'sync_error',
            error_message: error.message,
            retryable: true,
          });
        
        // Continue with next mapping
        failedRecords++;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        recordsProcessed: totalRecordsProcessed,
        failedRecords: failedRecords,
        message: `Processed ${totalRecordsProcessed} records with ${failedRecords} errors`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in syncData:', error);
    
    // Update sync log with error if created
    if (syncLogId) {
      await supabase
        .from('gl_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          message: `Error: ${error.message}`,
        })
        .eq('id', syncLogId);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to sync data',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions

// Fetch data from Glide
async function fetchGlideData(apiKey, appId, tableId) {
  const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appID: appId,
      queries: [
        { 
          tableName: tableId,
          limit: 10000
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data || !data[0] || !data[0].rows) {
    return { rows: [], columns: {} };
  }
  
  return {
    rows: data[0].rows,
    columns: data[0].columns
  };
}

// Sync data from Glide to Supabase
async function syncGlideToSupabase(supabase, tableName, glideRows, columnMappings) {
  let processed = 0;
  let errors = 0;
  
  // Process in batches of 100 for better performance
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < glideRows.length; i += batchSize) {
    batches.push(glideRows.slice(i, i + batchSize));
  }
  
  console.log(`Processing ${glideRows.length} records in ${batches.length} batches`);
  
  for (const batch of batches) {
    const supabaseRows = batch.map(glideRow => {
      try {
        const row = { glide_row_id: glideRow['$rowID'] };
        
        // Map Glide columns to Supabase columns
        Object.entries(columnMappings).forEach(([glideColumnId, mapping]) => {
          const { glide_column_name, supabase_column_name, data_type } = mapping;
          
          if (glideColumnId === '$rowID' && supabase_column_name === 'glide_row_id') {
            return; // Already handled
          }
          
          const value = glideRow[glide_column_name];
          if (value !== undefined) {
            // Convert value based on data type
            switch (data_type) {
              case 'string':
              case 'image-uri':
              case 'email-address':
                row[supabase_column_name] = String(value);
                break;
              case 'number':
                row[supabase_column_name] = Number(value);
                break;
              case 'boolean':
                row[supabase_column_name] = typeof value === 'string' 
                  ? value.toLowerCase() === 'true'
                  : Boolean(value);
                break;
              case 'date-time':
                row[supabase_column_name] = new Date(value).toISOString();
                break;
              default:
                row[supabase_column_name] = value;
            }
          }
        });
        
        return row;
      } catch (error) {
        console.error('Error mapping Glide row:', error);
        errors++;
        return null;
      }
    }).filter(Boolean);
    
    try {
      // Use upsert to handle both inserts and updates
      const { error } = await supabase
        .from(tableName)
        .upsert(supabaseRows, { 
          onConflict: 'glide_row_id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      processed += supabaseRows.length;
    } catch (error) {
      console.error('Error upserting batch to Supabase:', error);
      errors += batch.length;
    }
  }
  
  return { processed, errors };
}

// Sync data from Supabase to Glide
async function syncSupabaseToGlide(apiKey, appId, tableId, supabaseRows, columnMappings) {
  let processed = 0;
  let errors = 0;
  
  // Process in batches of 100 for better performance
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < supabaseRows.length; i += batchSize) {
    batches.push(supabaseRows.slice(i, i + batchSize));
  }
  
  console.log(`Processing ${supabaseRows.length} records in ${batches.length} batches`);
  
  for (const batch of batches) {
    try {
      const glideRows = batch.map(supabaseRow => {
        try {
          const row = { $rowID: supabaseRow.glide_row_id };
          
          // Map Supabase columns to Glide columns
          Object.entries(columnMappings).forEach(([glideColumnId, mapping]) => {
            const { glide_column_name, supabase_column_name, data_type } = mapping;
            
            if (glideColumnId === '$rowID' && supabase_column_name === 'glide_row_id') {
              return; // Already handled
            }
            
            const value = supabaseRow[supabase_column_name];
            if (value !== undefined) {
              // Convert value based on data type
              switch (data_type) {
                case 'string':
                case 'image-uri':
                case 'email-address':
                  row[glide_column_name] = String(value);
                  break;
                case 'number':
                  row[glide_column_name] = Number(value);
                  break;
                case 'boolean':
                  row[glide_column_name] = Boolean(value);
                  break;
                case 'date-time':
                  row[glide_column_name] = new Date(value).toISOString();
                  break;
                default:
                  row[glide_column_name] = value;
              }
            }
          });
          
          return row;
        } catch (error) {
          console.error('Error mapping Supabase row:', error);
          errors++;
          return null;
        }
      }).filter(Boolean);
      
      // Update data in Glide
      const response = await fetch('https://api.glideapp.io/api/function/mutateTables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appID: appId,
          mutations: [
            { 
              tableName: tableId,
              rows: glideRows
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
      }
      
      processed += glideRows.length;
    } catch (error) {
      console.error('Error updating batch in Glide:', error);
      errors += batch.length;
    }
  }
  
  return { processed, errors };
}
