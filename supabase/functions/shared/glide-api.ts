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

// Function to fetch data from a Glide table with pagination
export async function fetchGlideTableData(apiKey: string, appId: string, tableName: string, continuationToken: string | null) {
  let retries = 0;
  let success = false;
  let lastError = null;
  let result = null;
  
  // Implement retry logic with exponential backoff
  while (!success && retries < MAX_RETRIES) {
    try {
      const query: any = { tableName };
      
      if (continuationToken) {
        query.startAt = continuationToken;
      }
      
      console.log(`Fetching Glide data for table: ${tableName}, continuation: ${continuationToken ? 'yes' : 'no'}`);
      
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
      });
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = response.headers.get('retry-after') || 
                          (RETRY_DELAY_MS * Math.pow(2, retries)) / 1000;
        
        await new Promise(resolve => 
          setTimeout(resolve, parseInt(retryAfter as string) * 1000 || RETRY_DELAY_MS * Math.pow(2, retries))
        );
        retries++;
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Glide API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle different formats of Glide API responses
      if (data && Array.isArray(data) && data.length > 0) {
        const tableData = data[0];
        
        // Check if rows array exists directly
        if (tableData.rows && Array.isArray(tableData.rows)) {
          result = { 
            rows: tableData.rows,
            next: tableData.next || null
          };
        }
        // Sometimes Glide returns a direct array without the rows property
        else if (Array.isArray(tableData)) {
          result = {
            rows: tableData,
            next: data.next || null
          };
        }
        // Handle case where data is returned in a property matching the table name
        else if (tableData[tableName] && Array.isArray(tableData[tableName])) {
          result = {
            rows: tableData[tableName],
            next: tableData.next || null
          };
        }
        // Fallback for other response formats
        else {
          // Look for the first array in the response
          for (const key of Object.keys(tableData)) {
            if (Array.isArray(tableData[key]) && key !== 'next') {
              result = {
                rows: tableData[key],
                next: tableData.next || null
              };
              break;
            }
          }
          
          // If still no array found, try to extract from the data
          if (!result) {
            result = {
              rows: Array.isArray(Object.values(tableData)[0]) ? Object.values(tableData)[0] : [],
              next: tableData.next || null
            };
          }
        }
      } else {
        // If no data returned, return empty result
        result = { rows: [], next: null };
      }
      
      // Do a final check to ensure rows is always an array
      if (!Array.isArray(result.rows)) {
        console.warn('Expected rows to be an array, got:', typeof result.rows);
        result.rows = [];
      }
      
      success = true;
    } catch (error) {
      console.error(`Error fetching Glide data (attempt ${retries + 1}):`, error);
      lastError = error;
      retries++;
      
      if (retries < MAX_RETRIES) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retries))
        );
      }
    }
  }
  
  if (!success) {
    return { error: `Failed to fetch data after ${MAX_RETRIES} retries: ${lastError?.message}` };
  }
  
  return result;
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
