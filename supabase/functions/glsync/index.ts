
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleCors } from "../shared/cors.ts"
import { withRetry, handleError, MAX_BATCH_SIZE } from "../shared/sync-utils.ts"
import { 
  testGlideConnection, 
  listGlideTables, 
  getGlideTableColumns,
  fetchGlideTableData,
  sendGlideMutations
} from "../shared/glide-api.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Set up Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request payload
    const { action, connectionId, mappingId, tableId } = await req.json();

    // Create sync log entry
    const { data: logData, error: logError } = await supabase
      .from('gl_sync_logs')
      .insert({
        mapping_id: mappingId,
        status: 'started',
        message: `Starting ${action} operation`,
      })
      .select('id')
      .single();

    if (logError) return handleError(new Error('Failed to create sync log'));

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      return handleError(new Error('Connection not found'));
    }

    // Get mapping if provided
    let mapping = null;
    if (mappingId) {
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();

      if (mappingError || !mappingData) {
        return handleError(new Error('Mapping not found'));
      }
      mapping = mappingData;
    }

    // Execute requested action
    let result;
    switch (action) {
      case 'testConnection':
        result = await testGlideConnection(connection.api_key, connection.app_id);
        break;
      case 'listGlideTables':
        result = await listGlideTables(connection.api_key, connection.app_id);
        break;
      case 'getColumnMappings':
        if (!tableId) {
          return handleError(new Error('Table ID is required for getColumnMappings'));
        }
        result = await getGlideTableColumns(connection.api_key, connection.app_id, tableId);
        break;
      case 'syncData':
        if (!mapping) {
          return handleError(new Error('Mapping is required for syncData'));
        }
        result = await syncGlideData(supabase, connection, mapping, logData.id);
        break;
      default:
        return handleError(new Error('Invalid action'));
    }

    // Update sync log with final status
    if (action === 'syncData' && result) {
      await updateSyncLog(
        supabase,
        logData.id,
        result.success ? 'completed' : 'failed',
        `Sync ${result.success ? 'completed successfully' : 'failed'}. ${result.recordsProcessed || 0} records processed.`,
        result.recordsProcessed
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return handleError(error);
  }
});

// Helper function to update sync log status
async function updateSyncLog(
  supabase: any, 
  logId: string, 
  status: string, 
  message?: string, 
  recordsProcessed?: number
) {
  const updateData: any = {
    status,
    message,
  }
  
  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }
  
  if (recordsProcessed !== undefined) {
    updateData.records_processed = recordsProcessed
  }

  await supabase
    .from('gl_sync_logs')
    .update(updateData)
    .eq('id', logId)
}

// Simplified function to handle data synchronization between Glide and Supabase
async function syncGlideData(supabase: any, connection: any, mapping: any, logId: string) {
  const { glide_table, supabase_table, column_mappings, sync_direction } = mapping
  
  // If sync_direction is 'to_supabase', pull from Glide to Supabase
  if (sync_direction === 'to_supabase' || sync_direction === 'both') {
    console.log(`Starting sync from Glide to Supabase - Table: ${glide_table}`)
    return await pullFromGlideToSupabase(
      supabase,
      connection.api_key,
      connection.app_id,
      glide_table,
      supabase_table,
      column_mappings,
      mapping.id,
      logId
    )
  }
  
  // If sync_direction is 'to_glide', push from Supabase to Glide
  if (sync_direction === 'to_glide' || sync_direction === 'both') {
    console.log(`Starting sync from Supabase to Glide - Table: ${supabase_table}`)
    return await pushFromSupabaseToGlide(
      supabase,
      connection.api_key,
      connection.app_id,
      mapping,
      logId
    )
  }
  
  return { error: `Invalid sync direction: ${sync_direction}` }
}

// Function to pull data from Glide to Supabase (simplified approach)
async function pullFromGlideToSupabase(
  supabase: any,
  apiKey: string,
  appId: string,
  glideTable: string,
  supabaseTable: string,
  columnMappings: Record<string, any>,
  mappingId: string,
  logId: string
) {
  let totalRecordsProcessed = 0;
  let totalFailedRecords = 0;
  let continuationToken = null;
  let hasMore = true;
  
  // Update log with progress
  await updateSyncLog(
    supabase,
    logId,
    'processing',
    'Starting Glide to Supabase sync',
    0
  );
  
  try {
    // Loop until we have processed all data
    while (hasMore) {
      // Fetch a batch of data from Glide
      console.log(`Fetching batch from Glide - Table: ${glideTable}`)
      const result = await fetchGlideTableData(apiKey, appId, glideTable, continuationToken);
      
      if (result.error) {
        await recordSyncError(
          supabase,
          mappingId,
          'API_ERROR',
          `Error fetching data from Glide: ${result.error}`,
          null,
          true
        );
        
        return {
          success: false,
          error: result.error,
          recordsProcessed: totalRecordsProcessed,
          failedRecords: totalFailedRecords + 1
        };
      }
      
      const { rows, next } = result;
      
      if (!rows || rows.length === 0) {
        console.log('No more data to process');
        break;
      }
      
      console.log(`Processing ${rows.length} records`);
      
      // Transform the data
      const transformedRows = [];
      
      for (const row of rows) {
        try {
          // Get the Glide row ID
          const glideRowId = row.$rowID || row.id || row.rowId;
          
          if (!glideRowId) {
            console.error('Missing glide_row_id in record:', row);
            await recordSyncError(
              supabase,
              mappingId,
              'VALIDATION_ERROR',
              'Missing required glide_row_id',
              { rowData: row }
            );
            totalFailedRecords++;
            continue;
          }
          
          // Create the base record with the glide_row_id
          const transformedRow: Record<string, any> = {
            glide_row_id: glideRowId,
          };
          
          // Apply column mappings
          for (const [glideColumnId, mapping] of Object.entries(columnMappings)) {
            // Skip Glide system columns
            if (glideColumnId === '$rowID' || glideColumnId === '$rowIndex') {
              continue;
            }
            
            // If the Glide column exists in the row
            if (row[glideColumnId] !== undefined) {
              transformedRow[mapping.supabase_column_name] = row[glideColumnId];
            }
          }
          
          transformedRows.push(transformedRow);
        } catch (error) {
          console.error('Error processing record:', error);
          await recordSyncError(
            supabase,
            mappingId,
            'TRANSFORM_ERROR',
            `Error processing record: ${error.message}`,
            { rowData: row }
          );
          totalFailedRecords++;
        }
      }
      
      // Upsert the transformed data to Supabase
      console.log(`Upserting ${transformedRows.length} records to Supabase`);
      
      if (transformedRows.length > 0) {
        // Process in batches to avoid overloading the database
        for (let i = 0; i < transformedRows.length; i += MAX_BATCH_SIZE) {
          const batch = transformedRows.slice(i, i + MAX_BATCH_SIZE);
          
          try {
            const { error } = await supabase
              .from(supabaseTable)
              .upsert(batch, { onConflict: 'glide_row_id' });
            
            if (error) {
              console.error('Error upserting batch:', error);
              await recordSyncError(
                supabase,
                mappingId,
                'DATABASE_ERROR',
                `Error upserting data: ${error.message}`,
                { batchSize: batch.length },
                true
              );
              totalFailedRecords += batch.length;
            } else {
              totalRecordsProcessed += batch.length;
            }
          } catch (error) {
            console.error('Unexpected error during upsert:', error);
            await recordSyncError(
              supabase,
              mappingId,
              'DATABASE_ERROR',
              `Unexpected error during upsert: ${error.message}`,
              { batchSize: batch.length },
              true
            );
            totalFailedRecords += batch.length;
          }
          
          // Update progress
          await updateSyncLog(
            supabase,
            logId,
            'processing',
            `Processed ${totalRecordsProcessed} records so far`,
            totalRecordsProcessed
          );
        }
      }
      
      // Check if there's more data to fetch
      continuationToken = next;
      hasMore = !!continuationToken;
      
      // Add a small delay to avoid hitting rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Update connection's last_sync timestamp
    await supabase
      .from('gl_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', mapping.connection_id);
    
    // Get the errors for this sync
    const { data: errors } = await getSyncErrors(supabase, mappingId);
    
    return {
      success: totalFailedRecords === 0,
      recordsProcessed: totalRecordsProcessed,
      failedRecords: totalFailedRecords,
      errors: errors
    };
  } catch (error) {
    console.error('Error in pullFromGlideToSupabase:', error);
    
    await recordSyncError(
      supabase,
      mappingId,
      'SYSTEM_ERROR',
      `Error in sync process: ${error.message}`,
      null,
      true
    );
    
    return {
      success: false,
      error: `Error syncing data: ${error.message}`,
      recordsProcessed: totalRecordsProcessed,
      failedRecords: totalFailedRecords + 1
    };
  }
}

// Function to push data from Supabase to Glide
async function pushFromSupabaseToGlide(
  supabase: any,
  apiKey: string,
  appId: string,
  mapping: any,
  logId: string
) {
  const { id: mappingId, glide_table, supabase_table, column_mappings } = mapping;
  let totalRecordsProcessed = 0;
  let totalFailedRecords = 0;
  
  // Update log with progress
  await updateSyncLog(
    supabase,
    logId,
    'processing',
    `Starting Supabase to Glide sync`,
    0
  );
  
  try {
    // Get records from Supabase
    console.log(`Fetching records from Supabase - Table: ${supabase_table}`);
    const { data: records, error } = await supabase
      .from(supabase_table)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(500);
    
    if (error) {
      await recordSyncError(
        supabase,
        mappingId,
        'DATABASE_ERROR',
        `Error fetching data from Supabase: ${error.message}`,
        null,
        true
      );
      
      return { 
        success: false,
        error: `Error fetching data from Supabase: ${error.message}`,
        recordsProcessed: 0,
        failedRecords: 1
      };
    }
    
    if (!records || records.length === 0) {
      return {
        success: true,
        recordsProcessed: 0,
        message: 'No records found to sync'
      };
    }
    
    console.log(`Processing ${records.length} records from Supabase to Glide`);
    
    // Create a reverse mapping from Supabase to Glide
    const reverseColumnMappings: Record<string, string> = {};
    
    Object.entries(column_mappings).forEach(([glideColumnId, mapping]: [string, any]) => {
      if (glideColumnId !== '$rowID' && glideColumnId !== '$rowIndex') {
        reverseColumnMappings[mapping.supabase_column_name] = glideColumnId;
      }
    });
    
    // Find the glide_row_id field
    const rowIdMapping = Object.entries(column_mappings).find(
      ([glideColumnId]) => glideColumnId === '$rowID'
    );
    
    if (!rowIdMapping) {
      return {
        success: false,
        error: 'Missing $rowID mapping required for Supabase to Glide sync',
        recordsProcessed: 0,
        failedRecords: 0
      };
    }
    
    const glideRowIdField = rowIdMapping[1].supabase_column_name;
    
    // Prepare mutations
    const mutations = [];
    
    for (const record of records) {
      // Skip records without a glide_row_id
      if (!record[glideRowIdField]) {
        totalFailedRecords++;
        continue;
      }
      
      // Prepare column values for the mutation
      const columnValues: Record<string, any> = {};
      
      for (const [supabaseColumn, value] of Object.entries(record)) {
        // Skip special fields
        if (
          supabaseColumn === glideRowIdField ||
          supabaseColumn === 'id' ||
          supabaseColumn === 'created_at' ||
          supabaseColumn === 'updated_at'
        ) {
          continue;
        }
        
        // If we have a mapping for this column
        if (reverseColumnMappings[supabaseColumn]) {
          const glideColumnId = reverseColumnMappings[supabaseColumn];
          
          // Only include non-null values
          if (value !== null && value !== undefined) {
            columnValues[glideColumnId] = value;
          }
        }
      }
      
      // Create the mutation
      mutations.push({
        kind: 'set-columns-in-row',
        tableName: glide_table,
        rowID: record[glideRowIdField],
        columnValues
      });
    }
    
    // Send mutations in batches
    console.log(`Sending ${mutations.length} mutations to Glide`);
    
    for (let i = 0; i < mutations.length; i += MAX_BATCH_SIZE) {
      const batch = mutations.slice(i, i + MAX_BATCH_SIZE);
      
      if (batch.length === 0) continue;
      
      try {
        // Update progress
        await updateSyncLog(
          supabase,
          logId,
          'processing',
          `Processing batch ${i / MAX_BATCH_SIZE + 1} of ${Math.ceil(mutations.length / MAX_BATCH_SIZE)}`,
          totalRecordsProcessed
        );
        
        // Send mutations
        const result = await sendGlideMutations(apiKey, appId, batch);
        
        if (result.error) {
          console.error('Error with Glide mutation batch:', result.error);
          
          await recordSyncError(
            supabase,
            mappingId,
            'API_ERROR',
            `Error with Glide mutation batch: ${result.error}`,
            { batchIndex: i, batchSize: batch.length },
            true
          );
          
          totalFailedRecords += batch.length;
        } else {
          totalRecordsProcessed += batch.length;
        }
      } catch (error) {
        console.error('Unexpected error during Glide mutation:', error);
        
        await recordSyncError(
          supabase,
          mappingId,
          'API_ERROR',
          `Unexpected error during Glide mutation: ${error.message}`,
          { batchIndex: i, batchSize: batch.length },
          true
        );
        
        totalFailedRecords += batch.length;
      }
      
      // Add a small delay between batches
      if (i + MAX_BATCH_SIZE < mutations.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Update the connection's last_sync timestamp
    await supabase
      .from('gl_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', mapping.connection_id);
    
    // Get the errors for this sync
    const { data: errors } = await getSyncErrors(supabase, mappingId);
    
    return {
      success: totalFailedRecords === 0,
      recordsProcessed: totalRecordsProcessed,
      failedRecords: totalFailedRecords,
      errors: errors
    };
  } catch (error) {
    console.error('Error in pushFromSupabaseToGlide:', error);
    
    await recordSyncError(
      supabase,
      mappingId,
      'SYSTEM_ERROR',
      `Error in sync process: ${error.message}`,
      null,
      true
    );
    
    return {
      success: false,
      error: `Error syncing data: ${error.message}`,
      recordsProcessed: totalRecordsProcessed,
      failedRecords: totalFailedRecords + 1
    };
  }
}

// Helper function to record sync errors
async function recordSyncError(
  supabase: any,
  mappingId: string,
  errorType: string,
  errorMessage: string,
  recordData: any = null,
  retryable: boolean = false
) {
  try {
    await supabase.rpc('gl_record_sync_error', {
      p_mapping_id: mappingId,
      p_error_type: errorType,
      p_error_message: errorMessage,
      p_record_data: recordData,
      p_retryable: retryable
    });
  } catch (error) {
    console.error('Error recording sync error:', error);
  }
}

// Helper function to get sync errors
async function getSyncErrors(supabase: any, mappingId: string) {
  try {
    return await supabase
      .from('gl_sync_errors')
      .select('*')
      .eq('mapping_id', mappingId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
  } catch (error) {
    console.error('Error fetching sync errors:', error);
    return { data: [] };
  }
}
