# Glide Sync Architecture

This document details the architecture and workflow of our Glide synchronization system.

## Overview

The Glide sync system facilitates bidirectional data synchronization between our Supabase database and Glide applications. It handles data mapping, transformation, error handling, and validation to ensure consistent data across both platforms.

## System Components

### 1. Database Layer

#### Tables
- `gl_connections`: Stores Glide API connection credentials and settings
- `gl_mappings`: Defines the relationship between Glide tables and Supabase tables
- `gl_sync_logs`: Records sync operations and their results
- `gl_sync_errors`: Stores detailed error information for failed sync operations
- `gl_[entity]`: Domain-specific tables for synced data (e.g., `gl_products`, `gl_accounts`)

#### Views
- `gl_mapping_status`: Real-time view aggregating sync status information for each mapping
- `gl_recent_logs`: Shows recent sync operations with additional context
- `gl_product_sync_stats`: Provides statistics about product synchronization
- `gl_sync_stats`: Aggregates daily sync metrics and statistics
- `gl_tables_view`: Lists available Supabase tables for mapping

#### Functions
- `gl_validate_column_mapping`: Validates mapping configuration for consistency
- `gl_get_sync_errors`: Retrieves sync errors for a specific mapping
- `gl_record_sync_error`: Records a sync error with contextual information
- `gl_resolve_sync_error`: Marks an error as resolved with resolution notes
- `glsync_retry_failed_sync`: Initiates a retry for a failed sync operation
- `update_product_inventory`: Updates product inventory based on purchase and sales records

### 2. API Layer

#### Glide API Endpoints
- **Query Endpoint**: `https://api.glideapp.io/api/function/queryTables`
  - Used for reading data from Glide tables
  - Supports pagination via continuation tokens (next/startAt)
  - Handles table schema discovery and listing available tables
  - Supports SQL-like filtering for Big Tables
  - Returns data in a standardized format with rows and next token

- **Mutation Endpoint**: `https://api.glideapp.io/api/function/mutateTables`
  - Used for creating, updating, and deleting records in Glide
  - Supports batch operations (up to 500 mutations per request)
  - Requires specific mutation types and structure
  - Returns success/failure status for each mutation

#### Edge Functions
- `glsync`: Main edge function handling sync operations:
  - Testing connections to Glide API
  - Listing Glide tables and retrieving schema information
  - Fetching and synchronizing data in both directions
  - Managing column mappings and data transformations
  - Handling errors and implementing retry mechanisms

#### Shared Utilities
- `glide-api.ts`: Functions for interacting with Glide's API
  - `testGlideConnection`: Validates API credentials
  - `listGlideTables`: Retrieves available tables
  - `getGlideTableColumns`: Discovers table schema
  - `fetchGlideTableData`: Retrieves records with pagination
  - `sendGlideMutations`: Sends batch operations to Glide

- `cors.ts`: Utilities for handling CORS in edge functions
- `glsync-transformers.ts`: Data transformation and validation utilities
  - Handles type conversions between Glide and Supabase
  - Manages bidirectional field mapping

### 3. Application Layer

#### Components
- `ConnectionsManager`: UI for managing Glide connections
- `MappingsManager`: UI for configuring table mappings
- `ColumnMappingEditor`: UI for setting up field mappings
- `SyncDashboard`: Overview of sync status and operations
- `SyncMetricsCard`: Displays sync statistics and performance metrics
- `SyncErrorDisplay`: Shows and manages sync errors
- `MappingDetailsCard`: Detailed view of a specific mapping

#### Hooks
- `useGlSync`: Core hook for sync operations
- `useGlSyncStatus`: Hook for fetching sync status information
- `useGlSyncErrors`: Hook for retrieving and managing error records
- `useProductMapping`: Hook for managing product-specific mappings

## Data Flow

### Sync Process

1. **Initialization**:
   - Retrieve connection information from `gl_connections`
   - Load and validate mapping configuration from `gl_mappings`
   - Create sync log entry with status "started"

2. **Data Retrieval**:
   - **From Glide to Supabase**:
     - Call Glide queryTables API with continuation tokens for pagination
     - Transform received data according to mapping rules
     - Apply data type conversions and validations
   - **From Supabase to Glide**:
     - Query Supabase tables with appropriate filters
     - Transform data according to reverse mapping
     - Prepare mutation payloads for Glide API

3. **Data Processing**:
   - For each record:
     - Apply transformations (type conversions, field mappings)
     - Generate unique identifiers and timestamps
     - Handle relationships between entities
     - Validate data integrity

4. **Data Storage**:
   - **To Supabase**:
     - Upsert processed records to Supabase tables
     - Update inventory and related records via triggers
   - **To Glide**:
     - Batch mutations in groups of up to 500 records
     - Send to mutateTables API endpoint with proper operations
     - Track success/failure of each batch

5. **Finalization**:
   - Update sync log with completion status
   - Record metrics (records processed, errors, duration)
   - Update mapping status view
   - Trigger any necessary post-sync operations (inventory updates, etc.)

### Error Handling

1. **Error Classification**:
   - `VALIDATION_ERROR`: Data doesn't conform to expected schema
   - `TRANSFORM_ERROR`: Error during data transformation
   - `API_ERROR`: Glide API failures
   - `RATE_LIMIT`: API rate limiting issues
   - `NETWORK_ERROR`: Network connectivity problems

2. **Error Processing**:
   - Log detailed error information to `gl_sync_errors`
   - Determine if error is retryable
   - Continue processing other records
   - Update error counts in status views

3. **Error Resolution**:
   - Surface errors in UI for review
   - Provide context and resolution suggestions
   - Support manual resolution with notes
   - Enable retry operations for retryable errors

## Mapping System

### Glide API Operations

Glide API operations consist of queries and mutations that follow specific formats:

#### 1. Queries (Reading Data)

The `queryTables` endpoint reads data from Glide tables. A basic request looks like:

```json
{
  "appID": "YOUR_APP_ID",
  "queries": [
    {
      "tableName": "YOUR_TABLE_NAME",
      "startAt": "CONTINUATION_TOKEN" // Optional, for pagination
    }
  ]
}
```

**Response format:**
```json
[
  {
    "rows": [
      { "column1": "value1", "column2": "value2", "$rowID": "row123" },
      // More rows...
    ],
    "next": "NEXT_CONTINUATION_TOKEN" // Optional, if more rows exist
  }
]
```

**Advanced Queries with SQL (for Big Tables):**

```json
{
  "appID": "YOUR_APP_ID",
  "queries": [
    {
      "sql": "SELECT * FROM \"TableName\" WHERE \"Column\" = $1 AND (\"OtherColumn\" = $2 OR \"AnotherColumn\" = $3) LIMIT 10",
      "params": ["Value1", "Value2", "Value3"]
    }
  ]
}
```

**Pagination Implementation:**

```typescript
async function getAllRows(apiKey: string, appId: string, tableName: string) {
  let allRows = [];
  let continuationToken = null;
  
  do {
    const result = await fetchGlideTableData(apiKey, appId, tableName, continuationToken);
    
    if (result.error) {
      throw new Error(`Error fetching data: ${result.error}`);
    }
    
    allRows = [...allRows, ...result.rows];
    continuationToken = result.next;
    
    // Log progress for large tables
    console.log(`Retrieved ${allRows.length} rows so far...`);
    
  } while (continuationToken);
  
  return allRows;
}
```

#### 2. Mutations (Creating, Updating, Deleting Data)

The `mutateTables` endpoint writes data to Glide. The request format is:

```json
{
  "appID": "YOUR_APP_ID",
  "mutations": [
    // Mutation operations (up to 500)
  ]
}
```

**Mutation Types:**

1. **Add Row (`add-row-to-table`):**
   ```json
   {
     "kind": "add-row-to-table",
     "tableName": "YOUR_TABLE_NAME",
     "columnValues": {
       "Column1": "Value1",
       "Column2": "Value2"
     }
   }
   ```

2. **Update Row (`set-columns-in-row`):**
   ```json
   {
     "kind": "set-columns-in-row",
     "tableName": "YOUR_TABLE_NAME",
     "columnValues": {
       "Column1": "UpdatedValue1",
       "Column2": "UpdatedValue2"
     },
     "rowID": "row123"
   }
   ```

3. **Delete Row (`delete-row`):**
   ```json
   {
     "kind": "delete-row",
     "tableName": "YOUR_TABLE_NAME",
     "rowID": "row123"
   }
   ```

**Batching Mutations Implementation:**

```typescript
async function sendBatchedMutations(apiKey: string, appId: string, mutations: any[]) {
  const batchSize = 500; // Maximum allowed by Glide API
  const batches = [];
  const results = [];
  
  // Create batches of mutations
  for (let i = 0; i < mutations.length; i += batchSize) {
    batches.push(mutations.slice(i, i + batchSize));
  }
  
  // Process each batch
  for (const batch of batches) {
    try {
      const result = await sendGlideMutations(apiKey, appId, batch);
      
      if (result.error) {
        console.error(`Batch error: ${result.error}`);
        // Handle error (retry, log, etc.)
      } else {
        results.push(result.data);
      }
    } catch (error) {
      console.error(`Exception in batch: ${error.message}`);
      // Handle exception
    }
  }
  
  return results;
}
```

### Column Mapping Structure

```json
{
  "$rowID": {
    "glide_column_name": "$rowID",
    "supabase_column_name": "glide_row_id",
    "data_type": "string"
  },
  "product_name": {
    "glide_column_name": "product_name", 
    "supabase_column_name": "vendor_product_name",
    "data_type": "string"
  }
}
```

### Data Type Handling

- `string`: Text fields
- `number`: Numeric values
- `boolean`: True/false values
- `date-time`: Date and time values
- `image-uri`: URLs pointing to images
- `email-address`: Email formatted strings

### Sync Directions

- `to_supabase`: One-way sync from Glide to Supabase
- `to_glide`: One-way sync from Supabase to Glide
- `both`: Bidirectional synchronization

## Performance Considerations

### Pagination

- Glide API limits response size (up to 10,000 rows per request)
- Continuation tokens (`next` in response, `startAt` in subsequent requests) are used for fetching additional data
- Progress tracking is maintained throughout pagination

### Batching

- Mutations are grouped into batches (max 500 per request)
- Implementation balances throughput vs. error management
- Each batch has independent error handling

### Rate Limiting

- Implements exponential backoff for rate limited requests
- Maximum retry attempts configurable via constants
- Delay between retries increases with each attempt

```typescript
async function fetchWithRetry(fn, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Real-time Updates

- Database changes trigger UI updates via Supabase realtime subscriptions
- Sync status and logs are updated in real-time
- Fallback polling mechanism ensures data freshness

## Validation and Data Integrity

- Pre-sync validation ensures mapping configuration is valid
- Data type validation before database operations
- Automatic type conversion based on mapping specifications
- Unique constraints enforce data integrity
- Error recovery mechanisms for partial failures

## Error Recovery

- Failed operations are logged with detailed context
- UI displays errors with resolution options
- Automatic retries for transient issues
- Manual resolution workflow for persistent errors
- Resolution notes for documentation and knowledge sharing

## Security

- API keys are stored securely in the database
- Access to sync operations is controlled via application permissions
- Database access is controlled via row-level security policies
- Edge functions use security definer functions for critical operations

## Monitoring and Observability

- Sync operation logs stored in `gl_sync_logs`
- Detailed error records in `gl_sync_errors`
- Status views provide at-a-glance system health metrics
- Performance metrics track sync efficiency and throughput
- Console logging in edge functions for debugging

## Future Improvements

- Scheduled sync operations
- Conflict resolution strategies for bidirectional sync
- Webhook support for real-time updates
- Enhanced retry mechanism for failed records
- Customizable transformation rules
- Multi-tenant support
- Advanced filtering for selective sync
- Schema change detection and auto-adaptation

## Implementation Details

### Glide to Supabase Sync Flow

1. **Fetch data from Glide**:
   ```typescript
   // Query Glide table with pagination
   async function syncGlideToSupabase(mapping, connection) {
     let processedRecords = 0;
     let continuationToken = null;
     
     do {
       // Fetch batch of data from Glide
       const { rows, next, error } = await fetchGlideTableData(
         connection.api_key,
         connection.app_id,
         mapping.glide_table,
         continuationToken
       );
       
       if (error) {
         throw new Error(`Failed to fetch data: ${error}`);
       }
       
       // Transform and upsert records
       const transformedRecords = rows.map(row => 
         transformGlideToSupabase(row, mapping.column_mappings)
       );
       
       // Upsert to Supabase
       await upsertToSupabase(mapping.supabase_table, transformedRecords);
       
       // Update progress
       processedRecords += rows.length;
       continuationToken = next;
       
     } while (continuationToken);
     
     return processedRecords;
   }
   ```

### Supabase to Glide Sync Flow

1. **Fetch data from Supabase**:
   ```typescript
   async function syncSupabaseToGlide(mapping, connection) {
     let processedRecords = 0;
     
     // Fetch data from Supabase table
     const { data, error } = await supabase
       .from(mapping.supabase_table)
       .select('*');
     
     if (error) {
       throw new Error(`Failed to fetch data: ${error.message}`);
     }
     
     // Transform records for Glide
     const mutations = data.map(record => {
       const transformedRecord = transformSupabaseToGlide(
         record, 
         mapping.column_mappings
       );
       
       // If record has Glide Row ID, update existing row
       if (record.glide_row_id) {
         return {
           kind: "set-columns-in-row",
           tableName: mapping.glide_table,
           columnValues: transformedRecord,
           rowID: record.glide_row_id
         };
       } 
       // Otherwise create new row
       else {
         return {
           kind: "add-row-to-table",
           tableName: mapping.glide_table,
           columnValues: transformedRecord
         };
       }
     });
     
     // Send mutations in batches
     await sendBatchedMutations(connection.api_key, connection.app_id, mutations);
     
     return mutations.length;
   }
   ```

## Future Improvements

- Scheduled sync operations
- Conflict resolution strategies for bidirectional sync
- Webhook support for real-time updates
- Enhanced retry mechanism for failed records
- Customizable transformation rules
- Multi-tenant support
- Advanced filtering for selective sync
- Schema change detection and auto-adaptation
