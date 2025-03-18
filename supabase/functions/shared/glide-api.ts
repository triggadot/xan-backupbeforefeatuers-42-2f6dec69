
import { corsHeaders } from './cors.ts'

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

// Simplified function to fetch data from a Glide table with pagination
export async function fetchGlideTableData(apiKey: string, appId: string, tableName: string, continuationToken: string | null = null) {
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
      console.error(`Glide API error: ${response.status} ${response.statusText}`)
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
    return { error: `Error sending mutations to Glide: ${error instanceof Error ? error.message : String(error)}` };
  }
}
