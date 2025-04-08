# Glidebase Sync Architecture

## Overview

The Glidebase Sync system provides bidirectional synchronization between Glide Apps and Supabase PostgreSQL database. It follows a standardized architecture pattern to ensure data integrity while allowing flexible relationships between tables. The system uses direct Glide API calls for all data operations.

## Key Components

### 1. Edge Function (`/supabase/functions/glsync`)

The edge function serves as the API endpoint that handles sync requests from Glide Apps. It:

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

The system relies on database triggers to maintain data integrity.

### 4. Views

The system uses views to simplify data access.

## Data Flow

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
8. Results and errors are logged and returned to client

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

This approach allows for more efficient data retrieval by filtering at the source rather than downloading all data.

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

## Handling Inconsistent Data

The Glidebase sync system is designed to handle inconsistent data from Glide:

1. **Standard Approach**: All tables use the same sync methodology
2. **Automatic Triggers**: Database triggers handle relationships and calculated fields
3. **Logging**: The system logs all errors for later review

This approach ensures that sync operations are consistent across all tables.

## Relationship Handling

The Glidebase system uses a specific pattern for relationships:

- No actual foreign key constraints in PostgreSQL
- Relationships are maintained through `rowid_` fields
- Database triggers handle relationship integrity
- Indexes on relationship fields optimize performance

## API Usage Considerations

Each call to the Glide API's `queryTables` operation counts as one update in Glide's usage metrics. The system is designed to minimize API calls by:

1. Fetching data in large batches (up to 10,000 rows per request)
2. Using filtered queries when possible to reduce data transfer
3. Implementing efficient pagination for large datasets
4. Caching frequently accessed data where appropriate
