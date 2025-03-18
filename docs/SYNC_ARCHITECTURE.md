
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

### 2. API Layer

#### Edge Functions
- `glsync`: Main edge function handling sync operations:
  - Testing connections
  - Listing Glide tables
  - Fetching and synchronizing data
  - Managing column mappings
  - Handling errors and retries

#### Shared Utilities
- `glide-api.ts`: Functions for interacting with Glide's API
- `cors.ts`: Utilities for handling CORS in edge functions
- `glsync-transformers.ts`: Data transformation and validation utilities

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

## Data Flow

### Sync Process

1. **Initialization**:
   - Retrieve connection information from `gl_connections`
   - Load and validate mapping configuration from `gl_mappings`
   - Create sync log entry with status "started"

2. **Data Retrieval**:
   - Fetch data from Glide API with pagination handling
   - Transform data according to mapping rules
   - Validate data against Supabase schema

3. **Data Processing**:
   - For each record:
     - Apply transformations (type conversions, field mappings)
     - Generate unique identifiers and timestamps
     - Handle relationships between entities
     - Validate data integrity

4. **Data Storage**:
   - Upsert processed records to Supabase
   - Record success/failure for each record
   - Handle potential database constraints
   - Log errors for failed records

5. **Finalization**:
   - Update sync log with completion status
   - Record metrics (records processed, errors, duration)
   - Update mapping status view
   - Trigger any necessary post-sync operations

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

- Glide API limits response size to 10,000 rows per request
- Continuation tokens are used for fetching additional data
- Progress tracking is maintained throughout pagination

```typescript
async function getAllRows(apiKey, appId, tableName) {
  let allRows = [];
  let continuationToken = null;
  
  do {
    const result = await fetchGlideTableData(apiKey, appId, tableName, continuationToken);
    allRows = [...allRows, ...result.rows];
    continuationToken = result.next;
  } while (continuationToken);
  
  return allRows;
}
```

### Batching

- Mutations are grouped into batches (max 500 per request)
- Implementation balances throughput vs. error management
- Each batch has independent error handling

### Rate Limiting

- Implements exponential backoff for rate limited requests
- Maximum retry attempts configurable via constants
- Delay between retries increases with each attempt

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
