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
