
export async function getGlideTableColumns(apiKey: string, appId: string, tableId: string) {
  console.log(`Getting columns for Glide table: ${tableId}`);
  
  try {
    // Make a request to Glide API to get table schema
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
            limit: 1  // Just need schema, not actual data
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Glide API response:', JSON.stringify(data));
    
    // Check if we have columns data
    if (!data[0] || !data[0].columns) {
      return [];
    }
    
    // Format columns for display
    const columns = Object.entries(data[0].columns).map(([id, info]: [string, any]) => ({
      id,
      name: info.name,
      type: info.type || 'string'
    }));
    
    return columns;
  } catch (error) {
    console.error('Error fetching Glide table columns:', error);
    throw error;
  }
}

export async function testGlideConnection(supabase: any, connectionId: string) {
  try {
    // Fetch connection details
    const { data: connection, error: connectionError } = await supabase
      .from('gl_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    
    if (connectionError) throw connectionError;
    
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    // Test connection by making a simple request to Glide API
    const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appID: connection.app_id,
        queries: [{ limit: 1 }]  // Empty query to just test connectivity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    // If successful, update the connection status and last tested time
    await supabase
      .from('gl_connections')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Connection successful'
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error testing Glide connection:', error);
    
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
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200  // Still return 200 so front-end can handle the error message
      }
    );
  }
}

export async function fetchGlideTableData(apiKey: string, appId: string, tableId: string, limit: number = 1000) {
  console.log(`Fetching data from Glide table: ${tableId}, limit: ${limit}`);
  
  try {
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
            limit: limit
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Check if we have data
    if (!data[0] || !data[0].rows) {
      return { rows: [], columns: {} };
    }
    
    return {
      rows: data[0].rows,
      columns: data[0].columns
    };
  } catch (error) {
    console.error('Error fetching Glide table data:', error);
    throw error;
  }
}

export async function updateGlideData(apiKey: string, appId: string, tableId: string, rows: any[]) {
  console.log(`Updating data in Glide table: ${tableId}, rows count: ${rows.length}`);
  
  try {
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
            rows: rows
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Glide API returned: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating Glide data:', error);
    throw error;
  }
}
