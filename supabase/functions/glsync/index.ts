
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../shared/cors.ts"
import { 
  testGlideConnection, 
  listGlideTables, 
  getGlideTableColumns,
  fetchGlideTableData,
  sendGlideMutations
} from "../shared/glide-api.ts"

// Define rate limiting parameters
const MAX_BATCH_SIZE = 450 // Keep under 500 limit for safety

// Handle API requests
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request data
    const { action, connectionId, mappingId, tableId } = await req.json()

    // Create a sync log entry
    const { data: logData, error: logError } = await supabase
      .from('gl_sync_logs')
      .insert({
        mapping_id: mappingId,
        status: 'started',
        message: `Starting ${action} operation`,
      })
      .select('id')
      .single()

    if (logError) {
      console.error('Error creating sync log:', logError)
      return errorResponse('Failed to create sync log')
    }

    const logId = logData.id

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      await updateSyncLog(supabase, logId, 'failed', 'Connection not found')
      return errorResponse('Connection not found', 404)
    }

    // Get mapping details if a mapping ID is provided
    let mapping = null
    if (mappingId) {
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single()

      if (mappingError || !mappingData) {
        await updateSyncLog(supabase, logId, 'failed', 'Mapping not found')
        return errorResponse('Mapping not found', 404)
      }
      mapping = mappingData
    }

    // Execute the requested action
    let result
    switch (action) {
      case 'testConnection':
        result = await testGlideConnection(connection.api_key, connection.app_id)
        break
      case 'listGlideTables':
        result = await listGlideTables(connection.api_key, connection.app_id)
        break
      case 'getColumnMappings':
        if (!tableId) {
          await updateSyncLog(supabase, logId, 'failed', 'Table ID is required for getColumnMappings')
          return errorResponse('Table ID is required for getColumnMappings', 400)
        }
        result = await getGlideTableColumns(connection.api_key, connection.app_id, tableId)
        break
      case 'syncData':
        if (!mapping) {
          await updateSyncLog(supabase, logId, 'failed', 'Mapping is required for syncData')
          return errorResponse('Mapping is required for syncData', 400)
        }
        result = await syncGlideData(supabase, connection, mapping, logId)
        break
      default:
        await updateSyncLog(supabase, logId, 'failed', `Invalid action: ${action}`)
        return errorResponse('Invalid action', 400)
    }

    if (result.error) {
      await updateSyncLog(supabase, logId, 'failed', result.error)
      return errorResponse(result.error)
    }

    // Update sync log with success status
    if (action === 'syncData') {
      await updateSyncLog(
        supabase, 
        logId, 
        'completed', 
        `Sync completed successfully. Processed ${result.recordsProcessed} records.`,
        result.recordsProcessed
      )
    } else {
      await updateSyncLog(supabase, logId, 'completed', 'Operation completed successfully')
    }

    // Return the result
    return jsonResponse(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return errorResponse('Internal server error')
  }
})

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

// Function to handle data synchronization between Glide and Supabase
async function syncGlideData(supabase: any, connection: any, mapping: any, logId: string) {
  const { glide_table, supabase_table, column_mappings, sync_direction } = mapping
  
  // If sync_direction is 'to_glide' or 'both', we need to push from Supabase to Glide
  if (sync_direction === 'to_glide' || sync_direction === 'both') {
    try {
      return await pushFromSupabaseToGlide(
        supabase,
        connection.api_key,
        connection.app_id,
        mapping,
        logId
      )
    } catch (error) {
      return { error: `Error syncing data from Supabase to Glide: ${error.message}` }
    }
  }
  
  // If sync_direction is 'to_supabase' or 'both', we need to pull from Glide to Supabase
  if (sync_direction === 'to_supabase' || sync_direction === 'both') {
    try {
      // Special handling for products table
      if (supabase_table === 'gl_products') {
        return await syncProductsFromGlide(
          supabase,
          connection.api_key,
          connection.app_id,
          glide_table,
          column_mappings,
          mapping.id,
          logId
        )
      } else {
        return await pullFromGlideToSupabase(
          supabase,
          connection.api_key,
          connection.app_id,
          glide_table,
          supabase_table,
          column_mappings,
          logId
        )
      }
    } catch (error) {
      return { error: `Error syncing data from Glide to Supabase: ${error.message}` }
    }
  }
  
  return { error: `Invalid sync direction: ${sync_direction}` }
}

// New function to push data from Supabase to Glide
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
  let errorRecords: any[] = [];
  
  // Update log with progress
  await updateSyncLog(
    supabase,
    logId,
    'processing',
    `Starting Supabase to Glide sync`,
    0
  );
  
  try {
    // Get all records from the Supabase table
    // For this implementation, we'll focus on recently updated records
    const { data: records, error } = await supabase
      .from(supabase_table)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(500); // Reasonable batch size
    
    if (error) {
      await supabase.rpc('gl_record_sync_error', {
        p_mapping_id: mappingId,
        p_error_type: 'API_ERROR',
        p_error_message: `Error retrieving data from Supabase: ${error.message}`,
        p_retryable: true
      });
      
      return { 
        error: `Error retrieving data from Supabase: ${error.message}`,
        recordsProcessed: totalRecordsProcessed,
        failedRecords: totalFailedRecords + 1
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
    
    // Create a reverse mapping from Supabase column names to Glide column names
    const reverseColumnMappings: Record<string, { glide_column_id: string, data_type: string }> = {};
    
    Object.entries(column_mappings).forEach(([glideColumnId, mapping]: [string, any]) => {
      // Skip special Glide system columns handled separately
      if (glideColumnId !== '$rowID' && glideColumnId !== '$rowIndex') {
        reverseColumnMappings[mapping.supabase_column_name] = {
          glide_column_id: glideColumnId,
          data_type: mapping.data_type
        };
      }
    });
    
    // Identify the Glide rowID field
    const rowIdMapping = Object.entries(column_mappings).find(
      ([glideColumnId]) => glideColumnId === '$rowID'
    );
    
    if (!rowIdMapping) {
      return {
        error: 'Missing $rowID mapping required for Supabase to Glide sync',
        recordsProcessed: 0,
        failedRecords: 0
      };
    }
    
    const supabaseGlideRowIdField = rowIdMapping[1].supabase_column_name;
    
    // Prepare batch of mutations
    const mutations = records.map(record => {
      // Skip records without a glide_row_id
      if (!record[supabaseGlideRowIdField]) {
        totalFailedRecords++;
        return null;
      }
      
      // Prepare column values for the mutation
      const columnValues: Record<string, any> = {};
      
      Object.entries(record).forEach(([supabaseColumn, value]) => {
        // Skip the glide_row_id field and any Supabase-specific fields
        if (
          supabaseColumn === supabaseGlideRowIdField ||
          supabaseColumn === 'id' ||
          supabaseColumn === 'created_at' ||
          supabaseColumn === 'updated_at'
        ) {
          return;
        }
        
        // If we have a mapping for this Supabase column, use it
        if (reverseColumnMappings[supabaseColumn]) {
          const { glide_column_id, data_type } = reverseColumnMappings[supabaseColumn];
          
          // Transform value based on data type if needed
          if (value !== null && value !== undefined) {
            // For dates, ensure they're in ISO format
            if (data_type === 'date-time' && value instanceof Date) {
              columnValues[glide_column_id] = value.toISOString();
            } else {
              columnValues[glide_column_id] = value;
            }
          }
        }
      });
      
      // Create the mutation object
      return {
        kind: 'set-columns-in-row',
        tableName: glide_table,
        rowID: record[supabaseGlideRowIdField],
        columnValues
      };
    }).filter(mutation => mutation !== null);
    
    // Process mutations in batches to respect the 500 limit
    for (let i = 0; i < mutations.length; i += MAX_BATCH_SIZE) {
      const batch = mutations.slice(i, i + MAX_BATCH_SIZE);
      
      if (batch.length === 0) continue;
      
      try {
        // Update log with progress
        await updateSyncLog(
          supabase,
          logId,
          'processing',
          `Processing batch ${i / MAX_BATCH_SIZE + 1} of ${Math.ceil(mutations.length / MAX_BATCH_SIZE)}`,
          totalRecordsProcessed
        );
        
        // Send mutation request to Glide
        const result = await sendGlideMutations(apiKey, appId, batch);
        
        if (result.error) {
          // Record the error but continue with other batches
          console.error('Error with Glide mutation batch:', result.error);
          
          await supabase.rpc('gl_record_sync_error', {
            p_mapping_id: mappingId,
            p_error_type: 'API_ERROR',
            p_error_message: `Error with Glide mutation batch: ${result.error}`,
            p_record_data: { batchIndex: i, batchSize: batch.length },
            p_retryable: true
          });
          
          totalFailedRecords += batch.length;
        } else {
          totalRecordsProcessed += batch.length;
        }
      } catch (error) {
        console.error('Unexpected error during Glide mutation:', error);
        
        await supabase.rpc('gl_record_sync_error', {
          p_mapping_id: mappingId,
          p_error_type: 'API_ERROR',
          p_error_message: `Unexpected error during Glide mutation: ${error.message}`,
          p_record_data: { batchIndex: i, batchSize: batch.length },
          p_retryable: true
        });
        
        totalFailedRecords += batch.length;
      }
      
      // Add a small delay between batches to avoid rate limits
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
    const { data: errors } = await supabase
      .from('gl_sync_errors')
      .select('*')
      .eq('mapping_id', mappingId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Convert to the expected format for frontend
    const formattedErrors = (errors || []).map(error => ({
      type: error.error_type,
      message: error.error_message,
      record: error.record_data,
      timestamp: error.created_at,
      retryable: error.retryable
    }));
    
    return {
      success: totalFailedRecords === 0,
      recordsProcessed: totalRecordsProcessed,
      failedRecords: totalFailedRecords,
      errors: formattedErrors
    };
  } catch (error) {
    console.error('Error in pushFromSupabaseToGlide:', error);
    
    await supabase.rpc('gl_record_sync_error', {
      p_mapping_id: mappingId,
      p_error_type: 'API_ERROR',
      p_error_message: `Error in pushFromSupabaseToGlide: ${error.message}`,
      p_retryable: true
    });
    
    return {
      error: `Error syncing data from Supabase to Glide: ${error.message}`,
      recordsProcessed: totalRecordsProcessed,
      failedRecords: totalFailedRecords + 1
    };
  }
}

// Special function to sync products with additional validation
async function syncProductsFromGlide(
  supabase: any,
  apiKey: string,
  appId: string,
  glideTable: string,
  columnMappings: Record<string, any>,
  mappingId: string,
  logId: string
) {
  let continuationToken = null;
  let totalRecordsProcessed = 0;
  let totalFailedRecords = 0;
  let hasMore = true;
  let errorRecords: any[] = [];
  
  // Clear existing errors for this sync run
  await supabase
    .from('gl_sync_errors')
    .delete()
    .eq('mapping_id', mappingId)
    .is('resolved_at', null);
  
  // Loop until we have processed all data
  while (hasMore) {
    // Update log with progress
    await updateSyncLog(
      supabase,
      logId,
      'processing',
      `Processing batch from Glide. Total records so far: ${totalRecordsProcessed}`,
      totalRecordsProcessed
    );
    
    // Fetch a batch of data from Glide
    const glideData = await fetchGlideTableData(apiKey, appId, glideTable, continuationToken);
    
    if (glideData.error) {
      // Record the API error
      await supabase.rpc('gl_record_sync_error', {
        p_mapping_id: mappingId,
        p_error_type: 'API_ERROR',
        p_error_message: glideData.error,
        p_retryable: true
      });
      
      return { 
        error: glideData.error,
        recordsProcessed: totalRecordsProcessed,
        failedRecords: totalFailedRecords + 1
      };
    }
    
    const { rows, next } = glideData;
    
    if (!rows || rows.length === 0) {
      break;
    }
    
    console.log(`Processing ${rows.length} records from Glide`);
    
    // Transform the data using the column mappings and perform validation
    const transformedRecords = [];
    
    for (const row of rows) {
      try {
        // Extract the Glide row ID - explicitly check for $rowID first
        const glideRowId = row.$rowID || row.id || row.rowId;
        
        if (!glideRowId) {
          console.error('Missing glide_row_id in record:', row);
          recordValidationError(supabase, mappingId, 'Missing required glide_row_id ($rowID)', {
            rowData: row
          });
          totalFailedRecords++;
          continue;
        }
        
        const product = {
          glide_row_id: glideRowId,
        };
        
        // Flag to track if we encountered any errors for this record
        let hasErrors = false;
        
        // Apply column mappings
        Object.entries(columnMappings).forEach(([glideColumnId, mapping]: [string, any]) => {
          try {
            // Skip special Glide system columns
            if (glideColumnId === '$rowID' || glideColumnId === '$rowIndex') {
              return;
            }
            
            const glideColumnName = mapping.glide_column_name;
            const supabaseColumnName = mapping.supabase_column_name;
            const dataType = mapping.data_type;
            let value = row[glideColumnId];
            
            // Skip undefined values
            if (value === undefined) {
              return;
            }
            
            // Transform value based on data type
            switch (dataType) {
              case 'number':
                if (typeof value === 'string') {
                  const num = parseFloat(value);
                  if (isNaN(num)) {
                    hasErrors = true;
                    recordValidationError(supabase, mappingId, 'Invalid number format', {
                      glideColumnId,
                      glideColumnName,
                      supabaseColumnName,
                      value,
                      rowId: product.glide_row_id
                    });
                    totalFailedRecords++;
                    return;
                  }
                  value = num;
                } else if (typeof value !== 'number') {
                  hasErrors = true;
                  recordValidationError(supabase, mappingId, 'Expected number value', {
                    glideColumnId,
                    glideColumnName,
                    supabaseColumnName,
                    value,
                    rowId: product.glide_row_id
                  });
                  totalFailedRecords++;
                  return;
                }
                break;
                
              case 'boolean':
                if (typeof value === 'string') {
                  const lowered = value.toLowerCase();
                  if (lowered === 'true' || lowered === 'yes' || lowered === '1') {
                    value = true;
                  } else if (lowered === 'false' || lowered === 'no' || lowered === '0') {
                    value = false;
                  } else {
                    hasErrors = true;
                    recordValidationError(supabase, mappingId, 'Invalid boolean value', {
                      glideColumnId,
                      glideColumnName,
                      supabaseColumnName,
                      value,
                      rowId: product.glide_row_id
                    });
                    totalFailedRecords++;
                    return;
                  }
                } else if (typeof value !== 'boolean') {
                  hasErrors = true;
                  recordValidationError(supabase, mappingId, 'Expected boolean value', {
                    glideColumnId,
                    glideColumnName,
                    supabaseColumnName,
                    value,
                    rowId: product.glide_row_id
                  });
                  totalFailedRecords++;
                  return;
                }
                break;
                
              case 'date-time':
                if (value instanceof Date) {
                  value = value.toISOString();
                } else if (typeof value === 'string') {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    hasErrors = true;
                    recordValidationError(supabase, mappingId, 'Invalid date format', {
                      glideColumnId,
                      glideColumnName,
                      supabaseColumnName,
                      value,
                      rowId: product.glide_row_id
                    });
                    totalFailedRecords++;
                    return;
                  }
                  value = date.toISOString();
                } else {
                  hasErrors = true;
                  recordValidationError(supabase, mappingId, 'Expected date value', {
                    glideColumnId,
                    glideColumnName,
                    supabaseColumnName,
                    value,
                    rowId: product.glide_row_id
                  });
                  totalFailedRecords++;
                  return;
                }
                break;
              
              // For strings and other types, basic validation
              case 'string':
              case 'image-uri':
              case 'email-address':
                value = value === null ? null : String(value);
                
                // Additional validation for specific types
                if (dataType === 'image-uri' && value && 
                    !(value.startsWith('http://') || value.startsWith('https://'))) {
                  // Just log a warning, don't fail the record
                  console.warn(`Warning: Invalid image URI format for ${glideColumnName}: ${value}`);
                }
                
                if (dataType === 'email-address' && value && 
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  // Just log a warning, don't fail the record
                  console.warn(`Warning: Invalid email format for ${glideColumnName}: ${value}`);
                }
                break;
            }
            
            // Set the value in the product object if no errors
            if (!hasErrors) {
              product[supabaseColumnName] = value;
            }
            
          } catch (error) {
            hasErrors = true;
            recordTransformError(supabase, mappingId, 
              `Error transforming column ${glideColumnId}: ${error.message}`, {
              glideColumnId,
              glideColumnName: mapping.glide_column_name,
              supabaseColumnName: mapping.supabase_column_name,
              value: row[glideColumnId],
              rowId: product.glide_row_id
            });
            totalFailedRecords++;
          }
        });
        
        // If no errors and we have a valid product, add it to the batch
        if (!hasErrors && product.glide_row_id) {
          transformedRecords.push(product);
        } else if (!product.glide_row_id) {
          recordValidationError(supabase, mappingId, 'Missing required glide_row_id', {
            rowData: row
          });
          totalFailedRecords++;
        }
        
      } catch (error) {
        recordTransformError(supabase, mappingId, 
          `Unexpected error processing record: ${error.message}`, {
          rowData: row
        });
        totalFailedRecords++;
      }
    }
    
    // Insert or update the data in Supabase
    for (let i = 0; i < transformedRecords.length; i += MAX_BATCH_SIZE) {
      const batch = transformedRecords.slice(i, i + MAX_BATCH_SIZE);
      
      if (batch.length === 0) continue;
      
      try {
        // Upsert data to Supabase
        const { error } = await supabase
          .from('gl_products')
          .upsert(batch, { onConflict: 'glide_row_id' });
        
        if (error) {
          console.error('Error upserting batch to Supabase:', error);
          
          // Record the error
          await supabase.rpc('gl_record_sync_error', {
            p_mapping_id: mappingId,
            p_error_type: 'API_ERROR',
            p_error_message: `Error upserting data to Supabase: ${error.message}`,
            p_record_data: { batchSize: batch.length },
            p_retryable: true
          });
          
          totalFailedRecords += batch.length;
        } else {
          totalRecordsProcessed += batch.length;
        }
      } catch (error) {
        console.error('Unexpected error during upsert:', error);
        
        // Record the error
        await supabase.rpc('gl_record_sync_error', {
          p_mapping_id: mappingId,
          p_error_type: 'API_ERROR',
          p_error_message: `Unexpected error during upsert: ${error.message}`,
          p_record_data: { batchSize: batch.length },
          p_retryable: true
        });
        
        totalFailedRecords += batch.length;
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
  
  // Update the connection's last_sync timestamp
  await supabase
    .from('gl_connections')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', mapping.connection_id);
  
  // Get the errors for this sync
  const { data: errors } = await supabase
    .from('gl_sync_errors')
    .select('*')
    .eq('mapping_id', mappingId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Convert to the expected format for frontend
  const formattedErrors = (errors || []).map(error => ({
    type: error.error_type,
    message: error.error_message,
    record: error.record_data,
    timestamp: error.created_at,
    retryable: error.retryable
  }));
  
  // Store sync results
  const syncResult = {
    success: totalFailedRecords === 0,
    recordsProcessed: totalRecordsProcessed,
    failedRecords: totalFailedRecords,
    errors: formattedErrors
  };
  
  return syncResult;
}

// Helper function to record validation errors
async function recordValidationError(
  supabase: any,
  mappingId: string,
  message: string,
  recordData: any,
  retryable: boolean = false
) {
  try {
    await supabase.rpc('gl_record_sync_error', {
      p_mapping_id: mappingId,
      p_error_type: 'VALIDATION_ERROR',
      p_error_message: message,
      p_record_data: recordData,
      p_retryable: retryable
    })
  } catch (error) {
    console.error('Error recording validation error:', error)
  }
}

// Helper function to record transform errors
async function recordTransformError(
  supabase: any,
  mappingId: string,
  message: string,
  recordData: any,
  retryable: boolean = false
) {
  try {
    await supabase.rpc('gl_record_sync_error', {
      p_mapping_id: mappingId,
      p_error_type: 'TRANSFORM_ERROR',
      p_error_message: message,
      p_record_data: recordData,
      p_retryable: retryable
    })
  } catch (error) {
    console.error('Error recording transform error:', error)
  }
}

// Function to pull data from Glide to Supabase
async function pullFromGlideToSupabase(
  supabase: any,
  apiKey: string,
  appId: string,
  glideTable: string,
  supabaseTable: string,
  columnMappings: Record<string, any>,
  logId: string
) {
  let continuationToken = null;
  let totalRecordsProcessed = 0;
  let hasMore = true;
  
  // Loop until we have processed all data
  while (hasMore) {
    // Update log with progress
    await updateSyncLog(
      supabase,
      logId,
      'processing',
      `Processing batch from Glide. Total records so far: ${totalRecordsProcessed}`,
      totalRecordsProcessed
    );
    
    // Fetch a batch of data from Glide
    const glideData = await fetchGlideTableData(apiKey, appId, glideTable, continuationToken);
    
    if (glideData.error) {
      return { error: glideData.error };
    }
    
    const { rows, next } = glideData;
    
    if (!rows || rows.length === 0) {
      break;
    }
    
    // Transform the data using the column mappings
    const transformedRows = rows.map(row => {
      // Check for Glide's row identifier which could be $rowID, id, or rowId
      const glideRowId = row.$rowID || row.id || row.rowId;
      
      if (!glideRowId) {
        console.error('Missing glide_row_id in record:', row);
        return null;
      }
      
      const transformedRow: Record<string, any> = {
        glide_row_id: glideRowId,
      };
      
      // Apply column mappings with the new structure
      Object.entries(columnMappings).forEach(([glideColumnId, mapping]: [string, any]) => {
        // Skip special Glide system columns
        if (glideColumnId === '$rowID' || glideColumnId === '$rowIndex') {
          return;
        }
        
        if (row[glideColumnId] !== undefined) {
          transformedRow[mapping.supabase_column_name] = row[glideColumnId];
        }
      });
      
      return transformedRow;
    }).filter(row => row !== null);
    
    // Insert or update the data in Supabase
    for (let i = 0; i < transformedRows.length; i += MAX_BATCH_SIZE) {
      const batch = transformedRows.slice(i, i + MAX_BATCH_SIZE);
      
      if (batch.length === 0) continue;
      
      // Upsert data to Supabase
      const { error } = await supabase
        .from(supabaseTable)
        .upsert(batch, { onConflict: 'glide_row_id' });
      
      if (error) {
        return { error: `Error upserting data to Supabase: ${error.message}` };
      }
      
      totalRecordsProcessed += batch.length;
    }
    
    // Check if there's more data to fetch
    continuationToken = next;
    hasMore = !!continuationToken;
    
    // Add a small delay to avoid hitting rate limits
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Update the connection's last_sync timestamp
  await supabase
    .from('gl_connections')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', mapping.connection_id);
  
  return { success: true, recordsProcessed: totalRecordsProcessed };
}
