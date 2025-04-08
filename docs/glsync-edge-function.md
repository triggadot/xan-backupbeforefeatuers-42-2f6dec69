# Glidebase Sync Edge Function

## Overview

The Glidebase sync edge function (`/supabase/functions/glsync`) serves as the API endpoint for synchronizing data between Glide Apps and Supabase. This document details its implementation and usage.

## Implementation

The edge function is implemented using Deno and the Supabase Edge Functions framework. It handles various actions related to Glidebase synchronization.

### Core Structure

```typescript
// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const requestBody = await req.json();
    const { action, connectionId, mappingId, tableId } = requestBody;

    // Handle different actions
    if (action === 'testConnection') {
      return await testGlideConnectionHandler(supabase, connectionId);
    } 
    else if (action === 'getTableNames') {
      // Return existing Glide tables from gl_mappings
      // ...
    }
    else if (action === 'getColumnMappings') {
      return await getGlideColumnMappings(supabase, connectionId, tableId);
    }
    else if (action === 'syncData') {
      return await syncData(supabase, connectionId, mappingId);
    }
    else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    // Error handling
    // ...
  }
});
```

### Data Sync Process

The `syncData` function handles the core synchronization process:

1. **Fetch Data from Glide**:
   ```typescript
   const glideResponse = await fetch('https://api.glideapp.io/api/function/queryTables', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${connection.api_key}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       appID: connection.app_id,
       queries: [{ tableName: mapping.glide_table, limit: 10000 }]
     })
   });
   ```

2. **Transform Data**:
   ```typescript
   for (const glideRow of tableData.rows) {
     try {
       const supabaseRow: Record<string, any> = {};
       
       // Always map glide_row_id
       supabaseRow.glide_row_id = glideRow.$rowID;
       
       // Map other columns according to mapping
       for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
         if (glideColumnId === '$rowID') continue;
         
         const { glide_column_name, supabase_column_name, data_type } = mappingInfo as any;
         const glideValue = glideRow[glide_column_name];
         
         if (glideValue !== undefined) {
           supabaseRow[supabase_column_name] = transformValue(glideValue, data_type);
         }
       }
       
       transformedRows.push(supabaseRow);
     } catch (error) {
       // Error handling
     }
   }
   ```

3. **Standard Upsert for All Tables**:
   ```typescript
   // Use batching to avoid hitting limits
   const batchSize = 100;
   let recordsProcessed = 0;
   
   for (let i = 0; i < transformedRows.length; i += batchSize) {
     const batch = transformedRows.slice(i, i + batchSize);
     
     // Standard upsert for all tables including gl_estimate_lines
     const { error } = await supabase
       .from(mapping.supabase_table)
       .upsert(batch, { 
         onConflict: 'glide_row_id',
         ignoreDuplicates: false
       });
     
     if (error) {
       // Error handling
     } else {
       recordsProcessed += batch.length;
     }
   }
   ```

> **Note**: All tables, including `gl_estimate_lines`, use the standard upsert pattern. There is no special handling for any specific tables in accordance with the Glidebase pattern.

## Deployment

The edge function is deployed using the Supabase CLI:

```bash
supabase functions deploy glsync --project-ref your-project-ref
```

## Usage

The edge function can be called with different actions:

1. **Test Connection**:
   ```json
   {
     "action": "testConnection",
     "connectionId": "123e4567-e89b-12d3-a456-426614174000"
   }
   ```

2. **Get Table Names**:
   ```json
   {
     "action": "getTableNames",
     "connectionId": "123e4567-e89b-12d3-a456-426614174000"
   }
   ```

3. **Get Column Mappings**:
   ```json
   {
     "action": "getColumnMappings",
     "connectionId": "123e4567-e89b-12d3-a456-426614174000",
     "tableId": "Estimates"
   }
   ```

4. **Sync Data**:
   ```json
   {
     "action": "syncData",
     "connectionId": "123e4567-e89b-12d3-a456-426614174000",
     "mappingId": "123e4567-e89b-12d3-a456-426614174001"
   }
   ```
