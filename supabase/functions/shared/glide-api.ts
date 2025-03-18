
import { corsHeaders } from './cors.ts'
import { MAX_BATCH_SIZE, withRetry } from './sync-utils.ts';

// Define rate limiting parameters
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Function to test Glide API connection
export async function testGlideConnection(apiKey: string, appId: string) {
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
export async function listGlideTables(apiKey: string, appId: string) {
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
    const tableNames = Object.keys(data)
      .filter(key => Array.isArray(data[key]) && data[key].length > 0)
    
    return { tables: tableNames }
  } catch (error) {
    return { error: `Error fetching Glide tables: ${error.message}` }
  }
}

// Function to get column metadata for a Glide table
export async function getGlideTableColumns(apiKey: string, appId: string, tableId: string) {
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
          limit: 1,
          utc: true
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

// Simplified function to fetch data from a Glide table with pagination
export async function fetchGlideTableData(apiKey: string, appId: string, tableName: string, continuationToken: string | null) {
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
    
    // Make the API request
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appID: appId,
        queries: [queryObj]
      })
    })
    
    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 429) {
        return { error: 'Rate limit exceeded. Please try again later.' }
      }
      return { error: `Glide API error: ${response.status} ${response.statusText}` }
    }
    
    // Parse the response
    const data = await response.json()
    
    // Get the table data and continuation token
    if (data && Array.isArray(data) && data.length > 0) {
      if (!data[0].rows || !Array.isArray(data[0].rows)) {
        return { rows: [], next: null }
      }
      
      return {
        rows: data[0].rows,
        next: data[0].next || null
      }
    }
    
    return { rows: [], next: null }
  } catch (error) {
    return { error: `Error fetching Glide data: ${error.message}` }
  }
}

// Helper function to send mutations to Glide
export async function sendGlideMutations(apiKey: string, appId: string, mutations: any[]) {
  try {
    const response = await fetch('https://api.glideapp.io/api/function/mutateTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appID: appId,
        mutations
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Glide API error:', errorText);
      return { error: `Glide API error: ${response.status} ${response.statusText}` };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending mutations to Glide:', error);
    return { error: `Error sending mutations to Glide: ${error.message}` };
  }
}
