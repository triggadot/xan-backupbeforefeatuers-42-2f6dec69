# Glidebase Sync System

## Overview

The Glidebase Sync system provides bidirectional synchronization between Glide Apps and Supabase PostgreSQL database. It follows a standardized architecture pattern to ensure data integrity while allowing flexible relationships between tables.

## Key Components

### 1. Edge Function (`/supabase/functions/glsync`)

The edge function serves as the API endpoint that handles sync requests from Glide Apps:

- Authenticates requests using API keys
- Fetches data from Glide's API directly
- Transforms the data to match Supabase schema
- Uses a standardized upsert approach for all tables
- Handles error logging and reporting
- Supports pagination for large datasets

### 2. Database Tables

All tables follow the Glidebase pattern:
- Primary key: `id` (UUID)
- Glide identifier: `glide_row_id` (TEXT)
- Relationship fields: `rowid_[table_name]` (TEXT) referencing `glide_row_id` of related tables
- Timestamps: `created_at`, `updated_at`

### 3. Database Triggers

The system relies on database triggers to maintain data integrity:
- No foreign key constraints (by design)
- Relationships are maintained through `rowid_` fields
- Triggers handle calculated fields and relationship integrity

### 4. React Hooks

The system provides a unified React hook interface:
- `useGlSync` - Main hook for all sync operations
- Handles loading states, errors, and toast notifications
- Provides consistent API for components

## Architecture

### Unified Approach

Following the DRY principle, all sync functionality is consolidated into a single service with a thin React hook wrapper:

#### Service Layer (`src/services/glsync.ts`)
- Single source of truth for all Glide sync operations
- Handles API calls, data transformation, and error handling
- Provides consistent logging and error reporting

#### Hook Layer (`src/hooks/useGlSync.ts`)
- Thin wrapper around the service layer
- Handles React-specific concerns (loading states, errors, toast notifications)
- Provides a unified API for components

#### Types (`src/types/glsync.ts`)
- Comprehensive type definitions for all Glide sync operations
- Ensures type safety throughout the application

### Data Flow

1. Client initiates sync via UI
2. Edge function receives request with mapping ID
3. Edge function fetches data from Glide API using `queryTables` operation
4. For large datasets, pagination is handled using the `startAt` parameter
5. Data is transformed to match Supabase schema
6. **Standard Upsert**: All tables use the same upsert method with consistent configuration
   ```typescript
   const { error } = await supabase
     .from(mapping.supabase_table)
     .upsert(batch, { 
       onConflict: 'glide_row_id',
       ignoreDuplicates: false
     });
   ```
7. Database triggers automatically handle relationships and calculated fields
8. Results are returned with timing and processing information
9. Hook displays success/error toast messages

## Relationship Handling

The Glidebase system uses a specific pattern for relationships:

- No actual foreign key constraints in PostgreSQL
- Relationships are maintained through `rowid_` fields
- Database triggers handle relationship integrity
- Indexes on relationship fields optimize performance

This approach allows records to be created in any order during sync operations and prevents foreign key constraint violations when syncing data.

## Enhanced Logging

The system includes enhanced logging functionality:

- Detailed field-level information about sync operations
- Helps identify and troubleshoot issues with data synchronization
- Logs warnings if important fields are missing
- Creates detailed log entries with field-level information

### Logging Components

1. `createDetailedSyncLog` Utility Function
   - Creates detailed log entries with field-level information
   - Records sync status, duration, and affected records

2. UI Components for Viewing Logs
   - `SyncLogsView` - Displays detailed sync logs
   - `SyncOverview` - Provides an overview of sync operations

## Usage Examples

### Basic Sync Operation

```tsx
function SyncComponent() {
  const { syncMappingById, isLoading } = useGlSync();
  
  const handleSync = async () => {
    await syncMappingById('mapping-id-123');
  };
  
  return (
    <Button onClick={handleSync} disabled={isLoading}>
      Sync Data
    </Button>
  );
}
```

### Batch Sync Operation

```tsx
function BatchSyncComponent() {
  const { batchSyncMappings, progress } = useGlSync();
  
  const handleBatchSync = async () => {
    await batchSyncMappings(['mapping-1', 'mapping-2', 'mapping-3']);
  };
  
  return (
    <>
      <Button onClick={handleBatchSync}>Sync All</Button>
      <ProgressBar value={progress} />
    </>
  );
}
```

## Glide API Integration

### 1. Querying Data

The system uses the `queryTables` operation to fetch data from Glide:

```typescript
// Basic query
const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    appID: appId,
    queries: [{ 
      tableName: tableName,
      startAt: continuationToken // For pagination
    }]
  })
});
```

For large datasets (over 10,000 rows), the system handles pagination using the `next` token returned by the API.

### 2. Filtered Queries

For more complex data requirements, the system supports SQL-like filtering:

```typescript
// SQL-like filtering
const response = await fetch('https://api.glideapp.io/api/function/queryTables', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    appID: appId,
    queries: [{
      sql: 'SELECT * FROM "native-table-XYZ" WHERE "Status" = $1',
      params: ["Active"]
    }]
  })
});
```

### 3. Mutations

For bidirectional sync, the system supports mutations to update Glide data:

```typescript
// Update a row in Glide
const response = await fetch('https://api.glideapp.io/api/function/mutateTables', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    appID: appId,
    mutations: [{
      kind: 'set-columns-in-row',
      tableName: tableName,
      rowID: rowId,
      columnValues: updatedValues
    }]
  })
});
```

## Troubleshooting

### Common Issues

1. **Only `rowid` fields being synced**:
   - Check the `gl_mappings` table to ensure all fields are included in the mapping
   - Verify that the Glide table has all the expected fields

2. **Missing fields in sync logs**:
   - Check the `field_mappings` in the `gl_mappings` table
   - Ensure the fields exist in both Glide and Supabase tables
   - Verify that the sync operation is configured correctly

3. **Foreign key constraints causing sync failures**:
   - Remove foreign key constraints that are inconsistent with the Glidebase pattern
   - Follow the Glidebase pattern where relationships use `rowid_` fields

## Best Practices

1. **Monitoring Sync Operations**:
   - Regularly check the sync logs for warnings and errors
   - Pay attention to field-level details in the logs
   - Verify that all expected fields are being synced

2. **Maintaining Data Integrity**:
   - Follow the Glidebase pattern for relationships
   - Use proper indexes for relationship fields
   - Ensure all expected columns exist in the tables

3. **Optimizing Sync Performance**:
   - Use batch processing for large datasets
   - Monitor sync duration in the logs
   - Optimize database queries and indexes

## API Usage Considerations

Each call to the Glide API's `queryTables` operation counts as one update in Glide's usage metrics. The system is designed to minimize API calls by:

1. Fetching data in large batches (up to 10,000 rows per request)
2. Using filtered queries when possible to reduce data transfer
3. Implementing efficient pagination for large datasets
4. Caching frequently accessed data where appropriate

# Glidebase Column Mappings

## Overview

The Glidebase sync system uses a standardized approach to map columns between Glide and Supabase. This document explains the structure of column mappings and how they are processed during sync operations.

## Column Mappings Structure

Column mappings are stored in the `column_mappings` JSONB field of the `gl_mappings` table. The structure follows this pattern:

```json
{
  "GLIDE_COLUMN_ID": {
    "data_type": "string|number|boolean|date-time|etc",
    "glide_column_name": "humanReadableGlideColumnName",
    "supabase_column_name": "supabase_column_name"
  },
  "$rowID": {
    "data_type": "string",
    "glide_column_name": "$rowID",
    "supabase_column_name": "glide_row_id"
  }
}
```

### Example Column Mapping

```json
{
  "Cost": {
    "data_type": "number", 
    "glide_column_name": "mainCost", 
    "supabase_column_name": "cost"
  },
  "2vbZN": {
    "data_type": "number", 
    "glide_column_name": "mainTotalQtyPurchased", 
    "supabase_column_name": "total_qty_purchased"
  },
  "$rowID": {
    "data_type": "string", 
    "glide_column_name": "$rowID", 
    "supabase_column_name": "glide_row_id"
  }
}
```

## Key Components

### 1. Glide Column ID

The key in the mapping object is the Glide column ID, which is often a seemingly random string like `"2vbZN"`. This is the primary identifier used by Glide's API when returning data.

### 2. Data Type

The `data_type` field specifies the expected data type for the column. Supported types include:

- `string`: Text data
- `number`: Numeric data (integers or decimals)
- `boolean`: True/false values
- `date-time`: Date and time values
- `json`: JSON objects or arrays
- `email-address`: Email addresses
- `image-uri`: Image URLs

### 3. Glide Column Name

The `glide_column_name` field provides a human-readable name for the Glide column. This is used as a fallback when the column ID doesn't match.

### 4. Supabase Column Name

The `supabase_column_name` field specifies the target column name in the Supabase database table.

## Special Mappings

### $rowID Mapping

The `$rowID` mapping is required for all tables and maps to the `glide_row_id` column in Supabase. This is used for conflict resolution during upserts.

### Relationship Fields

Relationship fields follow a specific pattern:

```json
{
  "9aBFI": {
    "data_type": "string",
    "glide_column_name": "rowidAccountrowId",
    "supabase_column_name": "rowid_accounts"
  }
}
```

These fields link to other tables using the `rowid_` prefix in Supabase.

## How Column Mappings Are Used

During the sync process, the system:

1. **Validates the mappings**: Ensures all required fields are present and properly formatted
2. **Maps Glide data to Supabase format**: Uses the mappings to transform each row
3. **Handles special cases**: Processes relationships and data type conversions
4. **Upserts the data**: Uses the `glide_row_id` for conflict resolution

### Data Transformation Process

For each row from Glide:

1. Map the `$rowID` to `glide_row_id`
2. For each column mapping:
   - Try to get the value using the Glide column ID
   - If not found, fall back to using the Glide column name
   - Transform the value based on the specified data type
   - Map to the corresponding Supabase column

## Handling Missing or Invalid Mappings

The system includes several safeguards:

1. **Validation**: Column mappings are validated before processing
2. **Default $rowID mapping**: If not explicitly defined, a default mapping is added
3. **Error logging**: Transformation errors are logged for troubleshooting
4. **Fallback mechanisms**: Multiple approaches to find the correct data

## Best Practices

1. **Always include the $rowID mapping**: This is essential for proper sync operation
2. **Use consistent naming conventions**: Follow snake_case for Supabase columns
3. **Validate data types**: Ensure the specified data types match the actual data
4. **Handle relationships properly**: Use the `rowid_` prefix for relationship fields
5. **Test with sample data**: Verify mappings with representative data before full sync

## Troubleshooting

Common issues and solutions:

1. **Missing $rowID mapping**: Ensure the mapping includes the $rowID field
2. **Incorrect data types**: Verify that data types match the actual data
3. **Case sensitivity**: Column names in Supabase are case-sensitive
4. **Special characters**: Avoid special characters in column names
5. **Invalid JSON**: Ensure the column_mappings field contains valid JSON

## Example Implementation

```typescript
// Process data using column mappings
for (const glideRow of allRows) {
  const supabaseRow = {};
  
  // Always map glide_row_id
  supabaseRow.glide_row_id = glideRow.$rowID;
  
  // Map other columns according to mapping
  for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
    if (glideColumnId === '$rowID') continue; // Already handled
    
    const { glide_column_name, supabase_column_name, data_type } = mappingInfo;
    
    // Try to get the value using the column ID first, then fall back to the column name
    let glideValue = glideRow[glideColumnId];
    
    // If the value is undefined, try using the glide_column_name instead
    if (glideValue === undefined && glide_column_name) {
      glideValue = glideRow[glide_column_name];
    }
    
    if (glideValue !== undefined) {
      supabaseRow[supabase_column_name] = transformValue(glideValue, data_type);
    }
  }
  
  transformedRows.push(supabaseRow);
}
```

This documentation provides a comprehensive guide to understanding and using column mappings in the Glidebase sync system.
