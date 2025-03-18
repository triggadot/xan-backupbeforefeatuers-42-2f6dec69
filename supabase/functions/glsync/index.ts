import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define response headers with CORS support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define rate limiting parameters
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const MAX_BATCH_SIZE = 450 // Keep under 500 limit for safety

// Handle API requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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
      return new Response(
        JSON.stringify({ error: 'Failed to create sync log' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
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
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
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
        return new Response(
          JSON.stringify({ error: 'Mapping not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
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
          return new Response(
            JSON.stringify({ error: 'Table ID is required for getColumnMappings' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        result = await getGlideTableColumns(connection.api_key, connection.app_id, tableId)
        break
      case 'syncData':
        if (!mapping) {
          await updateSyncLog(supabase, logId, 'failed', 'Mapping is required for syncData')
          return new Response(
            JSON.stringify({ error: 'Mapping is required for syncData' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        result = await syncGlideData(supabase, connection, mapping, logId)
        break
      default:
        await updateSyncLog(supabase, logId, 'failed', `Invalid action: ${action}`)
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    if (result.error) {
      await updateSyncLog(supabase, logId, 'failed', result.error)
      return new Response(
        JSON.stringify({ error: result.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
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
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
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

// Function to test Glide API connection
async function testGlideConnection(apiKey: string, appId: string) {
  try {
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appID: appId,
        queries: [{ limit: 1 }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: `Failed to connect to Glide API: ${response.status} ${response.statusText}`,
        details: errorData
      }
    }

    return { success: true }
  } catch (error) {
    return { error: `Error connecting to Glide API: ${error.message}` }
  }
}

// Function to list tables from a Glide app
async function listGlideTables(apiKey: string, appId: string) {
  try {
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appID: appId,
        queries: [{ limit: 1 }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: `Failed to fetch Glide tables: ${response.status} ${response.statusText}`,
        details: errorData
      }
    }

    const data = await response.json()
    
    // Extract table names from the response
    // Note: This is a simplified approach, the actual implementation might require examining
    // the query structure differently depending on the Glide API response format
    const tableNames = Object.keys(data)
      .filter(key => Array.isArray(data[key]) && data[key].length > 0)
    
    return { tables: tableNames }
  } catch (error) {
    return { error: `Error fetching Glide tables: ${error.message}` }
  }
}

// Function to get column metadata for a Glide table
async function getGlideTableColumns(apiKey: string, appId: string, tableId: string) {
  try {
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appID: appId,
        queries: [{ 
          tableName: tableId,
          limit: 1 
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: `Failed to fetch Glide table schema: ${response.status} ${response.statusText}`,
        details: errorData
      }
    }

    const data = await response.json()
    
    if (!data || !data[0] || !data[0].rows || !data[0].rows[0]) {
      return { error: 'No data returned from Glide table' }
    }
    
    // Extract column names from the first record
    const sampleRecord = data[0].rows[0]
    const columns = Object.keys(sampleRecord).map(key => ({
      id: key,
      name: key,
      type: typeof sampleRecord[key]
    }))
    
    return { columns }
  } catch (error) {
    return { error: `Error fetching Glide table columns: ${error.message}` }
  }
}

// Function to handle data synchronization between Glide and Supabase
async function syncGlideData(supabase: any, connection: any, mapping: any, logId: string) {
  const { glide_table, supabase_table, column_mappings, sync_direction } = mapping
  
  // If sync_direction is 'to_glide' or 'both', we need to push from Supabase to Glide
  if (sync_direction === 'to_glide' || sync_direction === 'both') {
    // Logic for pushing data from Supabase to Glide would go here
    // For now, we'll focus on pulling from Glide to Supabase
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
  let continuationToken = null
  let totalRecordsProcessed = 0
  let totalFailedRecords = 0
  let hasMore = true
  let errorRecords: any[] = []
  
  // Clear existing errors for this sync run
  await supabase
    .from('gl_sync_errors')
    .delete()
    .eq('mapping_id', mappingId)
    .is('resolved_at', null)
  
  // Loop until we have processed all data
  while (hasMore) {
    // Update log with progress
    await updateSyncLog(
      supabase,
      logId,
      'processing',
      `Processing batch from Glide. Total records so far: ${totalRecordsProcessed}`,
      totalRecordsProcessed
    )
    
    // Fetch a batch of data from Glide
    const glideData = await fetchGlideTableData(apiKey, appId, glideTable, continuationToken)
    
    if (glideData.error) {
      // Record the API error
      await supabase.rpc('gl_record_sync_error', {
        p_mapping_id: mappingId,
        p_error_type: 'API_ERROR',
        p_error_message: glideData.error,
        p_retryable: true
      })
      
      return { 
        error: glideData.error,
        recordsProcessed: totalRecordsProcessed,
        failedRecords: totalFailedRecords + 1
      }
    }
    
    const { rows, next } = glideData
    
    if (!rows || rows.length === 0) {
      break
    }
    
    console.log(`Processing ${rows.length} records from Glide`)
    
    // Transform the data using the column mappings and perform validation
    const transformedRecords = []
    
    for (const row of rows) {
      try {
        const product = {
          glide_row_id: row.id || row.rowId || '',
        }
        
        // Flag to track if we encountered any errors for this record
        let hasErrors = false
        
        // Apply column mappings
        Object.entries(columnMappings).forEach(([glideColumnId, mapping]: [string, any]) => {
          try {
            const glideColumnName = mapping.glide_column_name
            const supabaseColumnName = mapping.supabase_column_name
            const dataType = mapping.data_type
            let value = row[glideColumnId]
            
            // Skip undefined values
            if (value === undefined) {
              return
            }
            
            // Transform value based on data type
            switch (dataType) {
              case 'number':
                if (typeof value === 'string') {
                  const num = parseFloat(value)
                  if (isNaN(num)) {
                    hasErrors = true
                    recordValidationError(supabase, mappingId, 'Invalid number format', {
                      glideColumnId,
                      glideColumnName,
                      supabaseColumnName,
                      value,
                      rowId: product.glide_row_id
                    })
                    totalFailedRecords++
                    return
                  }
                  value = num
                } else if (typeof value !== 'number') {
                  hasErrors = true
                  recordValidationError(supabase, mappingId, 'Expected number value', {
                    glideColumnId,
                    glideColumnName,
                    supabaseColumnName,
                    value,
                    rowId: product.glide_row_id
                  })
                  totalFailedRecords++
                  return
                }
                break
                
              case 'boolean':
                if (typeof value === 'string') {
                  const lowered = value.toLowerCase()
                  if (lowered === 'true' || lowered === 'yes' || lowered === '1') {
                    value = true
                  } else if (lowered === 'false' || lowered === 'no' || lowered === '0') {
                    value = false
                  } else {
                    hasErrors = true
                    recordValidationError(supabase, mappingId, 'Invalid boolean value', {
                      glideColumnId,
                      glideColumnName,
                      supabaseColumnName,
                      value,
                      rowId: product.glide_row_id
                    })
                    totalFailedRecords++
                    return
                  }
                } else if (typeof value !== 'boolean') {
                  hasErrors = true
                  recordValidationError(supabase, mappingId, 'Expected boolean value', {
                    glideColumnId,
                    glideColumnName,
                    supabaseColumnName,
                    value,
                    rowId: product.glide_row_id
                  })
                  totalFailedRecords++
                  return
                }
                break
                
              case 'date-time':
                if (value instanceof Date) {
                  value = value.toISOString()
                } else if (typeof value === 'string') {
                  const date = new Date(value)
                  if (isNaN(date.getTime())) {
                    hasErrors = true
                    recordValidationError(supabase, mappingId, 'Invalid date format', {
                      glideColumnId,
                      glideColumnName,
                      supabaseColumnName,
                      value,
                      rowId: product.glide_row_id
                    })
                    totalFailedRecords++
                    return
                  }
                  value = date.toISOString()
                } else {
                  hasErrors = true
                  recordValidationError(supabase, mappingId, 'Expected date value', {
                    glideColumnId,
                    glideColumnName,
                    supabaseColumnName,
                    value,
                    rowId: product.glide_row_id
                  })
                  totalFailedRecords++
                  return
                }
                break
              
              // For strings and other types, basic validation
              case 'string':
              case 'image-uri':
              case 'email-address':
                value = value === null ? null : String(value)
                
                // Additional validation for specific types
                if (dataType === 'image-uri' && value && 
                    !(value.startsWith('http://') || value.startsWith('https://'))) {
                  // Just log a warning, don't fail the record
                  console.warn(`Warning: Invalid image URI format for ${glideColumnName}: ${value}`)
                }
                
                if (dataType === 'email-address' && value && 
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  // Just log a warning, don't fail the record
                  console.warn(`Warning: Invalid email format for ${glideColumnName}: ${value}`)
                }
                break
            }
            
            // Set the value in the product object if no errors
            if (!hasErrors) {
              product[supabaseColumnName] = value
            }
            
          } catch (error) {
            hasErrors = true
            recordTransformError(supabase, mappingId, 
              `Error transforming column ${glideColumnId}: ${error.message}`, {
              glideColumnId,
              glideColumnName: mapping.glide_column_name,
              supabaseColumnName: mapping.supabase_column_name,
              value: row[glideColumnId],
              rowId: product.glide_row_id
            })
            totalFailedRecords++
          }
        })
        
        // If no errors and we have a valid product, add it to the batch
        if (!hasErrors && product.glide_row_id) {
          transformedRecords.push(product)
        } else if (!product.glide_row_id) {
          recordValidationError(supabase, mappingId, 'Missing required glide_row_id', {
            rowData: row
          })
          totalFailedRecords++
        }
        
      } catch (error) {
        recordTransformError(supabase, mappingId, 
          `Unexpected error processing record: ${error.message}`, {
          rowData: row
        })
        totalFailedRecords++
      }
    }
    
    // Insert or update the data in Supabase
    for (let i = 0; i < transformedRecords.length; i += MAX_BATCH_SIZE) {
      const batch = transformedRecords.slice(i, i + MAX_BATCH_SIZE)
      
      if (batch.length === 0) continue
      
      try {
        // Upsert data to Supabase
        const { error } = await supabase
          .from('gl_products')
          .upsert(batch, { onConflict: 'glide_row_id' })
        
        if (error) {
          console.error('Error upserting batch to Supabase:', error)
          
          // Record the error
          await supabase.rpc('gl_record_sync_error', {
            p_mapping_id: mappingId,
            p_error_type: 'API_ERROR',
            p_error_message: `Error upserting data to Supabase: ${error.message}`,
            p_record_data: { batchSize: batch.length },
            p_retryable: true
          })
          
          totalFailedRecords += batch.length
        } else {
          totalRecordsProcessed += batch.length
        }
      } catch (error) {
        console.error('Unexpected error during upsert:', error)
        
        // Record the error
        await supabase.rpc('gl_record_sync_error', {
          p_mapping_id: mappingId,
          p_error_type: 'API_ERROR',
          p_error_message: `Unexpected error during upsert: ${error.message}`,
          p_record_data: { batchSize: batch.length },
          p_retryable: true
        })
        
        totalFailedRecords += batch.length
      }
    }
    
    // Check if there's more data to fetch
    continuationToken = next
    hasMore = !!continuationToken
    
    // Add a small delay to avoid hitting rate limits
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Update the connection's last_sync timestamp
  await supabase
    .from('gl_connections')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', connection.id)
  
  // Get the errors for this sync
  const { data: errors } = await supabase
    .from('gl_sync_errors')
    .select('*')
    .eq('mapping_id', mappingId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(20)
  
  // Convert to the expected format for frontend
  const formattedErrors = (errors || []).map(error => ({
    type: error.error_type,
    message: error.error_message,
    record: error.record_data,
    timestamp: error.created_at,
    retryable: error.retryable
  }))
  
  // Store sync results
  const syncResult = {
    success: totalFailedRecords === 0,
    recordsProcessed: totalRecordsProcessed,
    failedRecords: totalFailedRecords,
    errors: formattedErrors
  }
  
  return syncResult
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
  let continuationToken = null
  let totalRecordsProcessed = 0
  let hasMore = true
  
  // Loop until we have processed all data
  while (hasMore) {
    // Update log with progress
    await updateSyncLog(
      supabase,
      logId,
      'processing',
      `Processing batch from Glide. Total records so far: ${totalRecordsProcessed}`,
      totalRecordsProcessed
    )
    
    // Fetch a batch of data from Glide
    const glideData = await fetchGlideTableData(apiKey, appId, glideTable, continuationToken)
    
    if (glideData.error) {
      return { error: glideData.error }
    }
    
    const { rows, next } = glideData
    
    if (!rows || rows.length === 0) {
      break
    }
    
    // Transform the data using the column mappings
    const transformedRows = rows.map(row => {
      const transformedRow: Record<string, any> = {
        glide_row_id: row.id || row.rowId, // Ensure we capture the Glide row ID
      }
      
      // Apply column mappings with the new structure
      Object.entries(columnMappings).forEach(([glideColumnId, mapping]: [string, any]) => {
        if (row[glideColumnId] !== undefined) {
          transformedRow[mapping.supabase_column_name] = row[glideColumnId]
        }
      })
      
      return transformedRow
    })
    
    // Insert or update the data in Supabase
    for (let i = 0; i < transformedRows.length; i += MAX_BATCH_SIZE) {
      const batch = transformedRows.slice(i, i + MAX_BATCH_SIZE)
      
      // Upsert data to Supabase
      const { error } = await supabase
        .from(supabaseTable)
        .upsert(batch, { onConflict: 'glide_row_id' })
      
      if (error) {
        return { error: `Error upserting data to Supabase: ${error.message}` }
      }
      
      totalRecordsProcessed += batch.length
    }
    
    // Check if there's more data to fetch
    continuationToken = next
    hasMore = !!continuationToken
    
    // Add a small delay to avoid hitting rate limits
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Update the connection's last_sync timestamp
  await supabase
    .from('gl_connections')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', connection.id)
  
  return { success: true, recordsProcessed: totalRecordsProcessed }
}

// Function to fetch data from a Glide table with pagination
async function fetchGlideTableData(
  apiKey: string,
  appId: string,
  tableName: string,
  continuationToken: string | null
) {
  let retries = 0
  let success = false
  let lastError = null
  let result = null
  
  // Implement retry logic with exponential backoff
  while (!success && retries < MAX_RETRIES) {
    try {
      const query: any = { tableName }
      
      if (continuationToken) {
        query.startAt = continuationToken
      }
      
      const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appID: appId,
          queries: [query]
        })
      })
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = response.headers.get('retry-after') || 
                          (RETRY_DELAY_MS * Math.pow(2, retries)) / 1000
        
        await new Promise(resolve => 
          setTimeout(resolve, parseInt(retryAfter) * 1000 || RETRY_DELAY_MS * Math.pow(2, retries))
        )
        retries++
        continue
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Glide API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      result = data[0] // Assuming the result is the first element in the array
      success = true
    } catch (error) {
      lastError = error
      retries++
      
      if (retries < MAX_RETRIES) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retries))
        )
      }
    }
  }
  
  if (!success) {
    return { error: `Failed to fetch data after ${MAX_RETRIES} retries: ${lastError?.message}` }
  }
  
  return result
}
