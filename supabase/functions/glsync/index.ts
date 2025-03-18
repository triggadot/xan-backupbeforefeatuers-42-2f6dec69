
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../shared/cors.ts'
import { fetchGlideTableData, testGlideConnection, listGlideTables, getGlideTableColumns } from '../shared/glide-api.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, connectionId, mappingId, tableId } = await req.json()
    
    // Initialize Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    if (action === 'testConnection') {
      const { data: connection, error: connectionError } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', connectionId)
        .single()
        
      if (connectionError) {
        throw new Error(`Connection not found: ${connectionError.message}`)
      }
      
      console.log(`Testing connection for app ID: ${connection.app_id}`)
      const result = await testGlideConnection(connection.api_key, connection.app_id)
      
      // Update connection status based on test result
      if (result.success) {
        await supabase
          .from('gl_connections')
          .update({ status: 'active', last_tested: new Date().toISOString() })
          .eq('id', connectionId)
      } else {
        await supabase
          .from('gl_connections')
          .update({ status: 'error', last_tested: new Date().toISOString() })
          .eq('id', connectionId)
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'listGlideTables') {
      if (!connectionId) {
        throw new Error('Connection ID is required')
      }
      
      // Get connection details
      const { data: connection, error: connectionError } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', connectionId)
        .single()
      
      if (connectionError) {
        throw new Error(`Connection not found: ${connectionError.message}`)
      }
      
      // List Glide tables
      console.log(`Listing tables for app ID: ${connection.app_id}`)
      const tables = await listGlideTables(connection.api_key, connection.app_id)
      
      return new Response(JSON.stringify({ tables }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'getColumnMappings') {
      if (!connectionId || !tableId) {
        throw new Error('Connection ID and Table ID are required')
      }
      
      // Get connection details
      const { data: connection, error: connectionError } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', connectionId)
        .single()
      
      if (connectionError) {
        throw new Error(`Connection not found: ${connectionError.message}`)
      }
      
      // Get table columns
      console.log(`Getting columns for table: ${tableId}`)
      const columns = await getGlideTableColumns(connection.api_key, connection.app_id, tableId)
      
      return new Response(JSON.stringify({ columns }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'syncData') {
      if (!mappingId) {
        throw new Error('Mapping ID is required')
      }
      
      // Get mapping details
      const { data: mapping, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single()
      
      if (mappingError) {
        throw new Error(`Mapping not found: ${mappingError.message}`)
      }
      
      // Get connection details
      const { data: connection, error: connectionError } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', mapping.connection_id)
        .single()
      
      if (connectionError) {
        throw new Error(`Connection not found: ${connectionError.message}`)
      }
      
      // Create sync log entry
      const { data: logData, error: logError } = await supabase
        .from('gl_sync_logs')
        .insert({
          mapping_id: mappingId,
          status: 'started',
          message: `Starting sync for ${mapping.glide_table_display_name || mapping.glide_table}`
        })
        .select('id')
        .single()
      
      if (logError) {
        throw new Error(`Failed to create sync log: ${logError.message}`)
      }
      
      const logId = logData.id
      
      console.log(`Starting sync for mapping ${mappingId}, log ${logId}`)
      console.log(`Syncing from Glide table: ${mapping.glide_table}`)
      
      // Process all data from Glide with pagination support
      let continuationToken = null
      let totalProcessed = 0
      let failedRecords = 0
      const errors = []
      let hasMoreData = true
      
      while (hasMoreData) {
        // Fetch data from Glide
        const result = await fetchGlideTableData(
          connection.api_key, 
          connection.app_id, 
          mapping.glide_table,
          continuationToken
        )
        
        if (result.error) {
          await supabase
            .from('gl_sync_logs')
            .update({
              status: 'failed',
              message: `Failed to fetch data: ${result.error}`,
              completed_at: new Date().toISOString()
            })
            .eq('id', logId)
          
          throw new Error(result.error)
        }
        
        const { rows, next } = result
        
        // Process the data
        if (rows.length > 0) {
          console.log(`Processing batch of ${rows.length} records`)
          
          // Transform Glide records to Supabase format
          const transformedRecords = rows.map(row => {
            // Map the fields based on mapping.column_mappings
            const mappedRecord: Record<string, any> = {}
            
            // Ensure glide_row_id is always set
            let hasRowIdMapping = false
            
            // Apply column mappings
            Object.entries(mapping.column_mappings).forEach(([glideColumnId, columnMapping]) => {
              const { glide_column_name, supabase_column_name, data_type } = columnMapping as any
              
              if (glideColumnId === '$rowID') {
                hasRowIdMapping = true
                mappedRecord['glide_row_id'] = row[glideColumnId] || row.id || null
              } else {
                // Get the value from Glide
                const value = row[glideColumnId]
                
                // Apply any data type transformations if needed
                let transformedValue = value
                
                // Convert types if necessary based on data_type
                if (value !== null && value !== undefined) {
                  if (data_type === 'number' && typeof value === 'string') {
                    transformedValue = parseFloat(value)
                    if (isNaN(transformedValue)) transformedValue = null
                  } else if (data_type === 'boolean' && typeof value === 'string') {
                    transformedValue = value.toLowerCase() === 'true'
                  }
                }
                
                mappedRecord[supabase_column_name] = transformedValue
              }
            })
            
            // If no explicit rowID mapping, use the row ID directly
            if (!hasRowIdMapping && row.$rowID) {
              mappedRecord['glide_row_id'] = row.$rowID
            }
            
            return mappedRecord
          })
          
          // Upsert data to Supabase
          const { error: upsertError } = await supabase
            .from(mapping.supabase_table)
            .upsert(transformedRecords, {
              onConflict: 'glide_row_id',
              ignoreDuplicates: false
            })
          
          if (upsertError) {
            console.error('Error upserting data:', upsertError)
            failedRecords += rows.length
            errors.push({
              type: 'DATABASE_ERROR',
              message: upsertError.message,
              retryable: true
            })
          } else {
            totalProcessed += rows.length
            
            // Update sync log with progress
            await supabase
              .from('gl_sync_logs')
              .update({
                status: 'processing',
                message: `Processed ${totalProcessed} records so far`,
                records_processed: totalProcessed
              })
              .eq('id', logId)
          }
        }
        
        // Check if there's more data to fetch
        continuationToken = next
        hasMoreData = !!continuationToken
      }
      
      // Update sync log with completion
      await supabase
        .from('gl_sync_logs')
        .update({
          status: failedRecords > 0 ? 'completed_with_errors' : 'completed',
          message: `Sync completed. Processed ${totalProcessed} records with ${failedRecords} failures.`,
          records_processed: totalProcessed,
          completed_at: new Date().toISOString()
        })
        .eq('id', logId)
      
      // Update connection's last_sync time
      await supabase
        .from('gl_connections')
        .update({
          last_sync: new Date().toISOString()
        })
        .eq('id', mapping.connection_id)
      
      return new Response(
        JSON.stringify({
          success: failedRecords === 0,
          recordsProcessed: totalProcessed,
          failedRecords,
          errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
