
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// GlideAPI helper class for direct HTTP requests
class GlideAPI {
  private apiKey: string;
  private appId: string;

  constructor(apiKey: string, appId: string) {
    this.apiKey = apiKey;
    this.appId = appId;
  }

  // Test connection
  async testConnection() {
    try {
      console.log(`Testing connection for app ID: ${this.appId}`)
      
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
      })

      if (!response.ok) {
        console.error(`Glide API connection failed: ${response.status} ${response.statusText}`)
        return {
          error: `Failed to connect to Glide API: ${response.status} ${response.statusText}`,
          success: false
        }
      }

      console.log('Glide API connection successful')
      return { success: true }
    } catch (error) {
      console.error('Error connecting to Glide API:', error)
      return { 
        error: `Error connecting to Glide API: ${error.message}`,
        success: false
      }
    }
  }

  // List tables
  async listTables() {
    try {
      console.log(`Listing tables for app ID: ${this.appId}`)
      
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
      })

      if (!response.ok) {
        throw new Error(`Failed to list tables: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data && data.tables && Array.isArray(data.tables)) {
        console.log(`Retrieved ${data.tables.length} tables`)
        return {
          tables: data.tables.map((table: any) => ({
            id: table.id,
            display_name: table.name
          }))
        }
      }
      
      return { tables: [] }
    } catch (error) {
      console.error('Error listing tables:', error)
      return { 
        error: `Error listing tables: ${error.message}`,
        tables: []
      }
    }
  }

  // Get table columns
  async getTableColumns(tableId: string) {
    try {
      console.log(`Getting columns for table ID: ${tableId}`)
      
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
      })

      if (!response.ok) {
        throw new Error(`Failed to get table columns: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data && Array.isArray(data) && data.length > 0 && data[0].rows && data[0].rows.length > 0) {
        const sampleRow = data[0].rows[0]
        
        // Extract columns from the first row
        const columns = Object.keys(sampleRow).map(key => {
          const value = sampleRow[key]
          let type = typeof value
          
          if (type === 'object' && value === null) {
            type = 'string' // Default to string for null values
          }
          
          if (key === '$rowID') {
            return { id: key, name: 'Row ID', type: 'string' }
          }
          
          return { id: key, name: key, type }
        })
        
        console.log(`Retrieved ${columns.length} columns`)
        return { columns }
      }
      
      return { columns: [] }
    } catch (error) {
      console.error('Error getting columns:', error)
      return { 
        error: `Error getting columns: ${error.message}`,
        columns: [] 
      }
    }
  }

  // Fetch data with pagination
  async fetchTableData(tableName: string, continuationToken: string | null = null) {
    try {
      // Build the query object
      const queryObj: Record<string, any> = { 
        tableName: tableName,
        utc: true // Use UTC time format for consistency
      }
      
      // Add continuation token if provided
      if (continuationToken) {
        queryObj.startAt = continuationToken
      }
      
      console.log(`Fetching data from Glide table: ${tableName}`)
      
      // Make the API request
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
      })
      
      // Handle HTTP errors
      if (!response.ok) {
        console.error(`Glide API error: ${response.status} ${response.statusText}`)
        return { error: `API error: ${response.status} ${response.statusText}` }
      }
      
      // Parse the response
      const data = await response.json()
      
      // Get the table data and continuation token
      if (data && Array.isArray(data) && data.length > 0) {
        if (!data[0].rows || !Array.isArray(data[0].rows)) {
          console.log('No rows returned from Glide')
          return { rows: [], next: null }
        }
        
        console.log(`Retrieved ${data[0].rows.length} rows from Glide`)
        
        return {
          rows: data[0].rows,
          next: data[0].next || null
        }
      }
      
      return { rows: [], next: null }
    } catch (error) {
      console.error('Error fetching Glide data:', error)
      return { error: `Error fetching Glide data: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  // Sync data from Glide to Supabase
  async syncData(supabase: any, mapping: any) {
    let continuationToken = null
    let totalProcessed = 0
    let failedRecords = 0
    const errors = []
    let hasMoreData = true
    
    // Create sync log entry
    const { data: logData, error: logError } = await supabase
      .from('gl_sync_logs')
      .insert({
        mapping_id: mapping.id,
        status: 'started',
        message: `Starting sync for ${mapping.glide_table_display_name || mapping.glide_table}`
      })
      .select('id')
      .single()
    
    if (logError) {
      console.error('Failed to create sync log:', logError)
      return { 
        success: false, 
        error: `Failed to create sync log: ${logError.message}` 
      }
    }
    
    const logId = logData.id
    
    console.log(`Starting sync for mapping ${mapping.id}, log ${logId}`)
    console.log(`Syncing from Glide table: ${mapping.glide_table}`)
    
    try {
      while (hasMoreData) {
        // Fetch data from Glide with pagination
        const result = await this.fetchTableData(mapping.glide_table, continuationToken)
        
        if (result.error) {
          await supabase
            .from('gl_sync_logs')
            .update({
              status: 'failed',
              message: `Failed to fetch data: ${result.error}`,
              completed_at: new Date().toISOString()
            })
            .eq('id', logId)
          
          return {
            success: false,
            error: result.error,
            recordsProcessed: totalProcessed,
            failedRecords: failedRecords
          }
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
            mappedRecord['glide_row_id'] = row.$rowID
            
            // Apply column mappings
            Object.entries(mapping.column_mappings).forEach(([glideColumnId, columnMapping]) => {
              const { glide_column_name, supabase_column_name, data_type } = columnMapping as any
              
              if (glideColumnId !== '$rowID') {
                // Get the value from Glide
                const value = row[glideColumnId]
                
                // Apply data type transformations if needed
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
      
      return {
        success: failedRecords === 0,
        recordsProcessed: totalProcessed,
        failedRecords,
        errors
      }
    } catch (error) {
      console.error('Error during sync:', error)
      
      // Update sync log with error
      await supabase
        .from('gl_sync_logs')
        .update({
          status: 'failed',
          message: `Error during sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', logId)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordsProcessed: totalProcessed,
        failedRecords: failedRecords
      }
    }
  }
}

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
      const glideAPI = new GlideAPI(connection.api_key, connection.app_id)
      const result = await glideAPI.testConnection()
      
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
      const glideAPI = new GlideAPI(connection.api_key, connection.app_id)
      const result = await glideAPI.listTables()
      
      return new Response(JSON.stringify(result), {
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
      const glideAPI = new GlideAPI(connection.api_key, connection.app_id)
      const result = await glideAPI.getTableColumns(tableId)
      
      return new Response(JSON.stringify(result), {
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
      
      // Sync data
      console.log(`Syncing data for mapping ${mappingId}`)
      const glideAPI = new GlideAPI(connection.api_key, connection.app_id)
      const result = await glideAPI.syncData(supabase, mapping)
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
