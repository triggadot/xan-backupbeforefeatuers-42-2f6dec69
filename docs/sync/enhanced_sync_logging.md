# Enhanced Sync Logging Documentation

## Overview

This document describes the enhanced sync logging functionality implemented for the Glidebase system, with a specific focus on the `gl_estimate_lines` table. The enhanced logging provides detailed field-level information about sync operations, helping to identify and troubleshoot issues with data synchronization.

## Key Components

### 1. `createDetailedSyncLog` Utility Function

**Location**: `src/components/sync/utils/syncUtils.ts`

**Purpose**: Creates detailed log entries with field-level information for sync operations.

**Parameters**:
- `mappingId`: string - The ID of the mapping being synced
- `status`: 'completed' | 'error' | 'warning' - The status of the sync operation
- `details`: object - Detailed information about the sync operation, including:
  - `message`: string - A descriptive message about the sync operation
  - `recordsProcessed`: number - The number of records processed
  - `syncedFields`: string[] - The fields that were synced
  - `syncDuration`: number - The duration of the sync operation in milliseconds
  - `recordDetails`: object - Details about the records that were synced, including:
    - `table`: string - The table that was synced
    - `inserted`: number - The number of records inserted
    - `updated`: number - The number of records updated
    - `failed`: number - The number of records that failed to sync
    - `sampleData`: object - A sample of the data that was synced

**Returns**: Promise<void> - The function creates a log entry in the database

**Example Usage**:
```typescript
await createDetailedSyncLog(
  'gl_estimate_lines',
  'completed',
  {
    message: 'Sync completed for gl_estimate_lines table',
    recordsProcessed: 100,
    syncedFields: ['glide_row_id', 'rowid_estimates', 'sale_product_name', 'qty_sold'],
    syncDuration: 1500,
    recordDetails: {
      table: 'gl_estimate_lines',
      inserted: 50,
      updated: 50,
      failed: 0,
      sampleData: { /* Sample record data */ }
    }
  }
);
```

### 2. Enhanced `syncData` Function

**Location**: `src/hooks/useSyncOperations.ts`

**Purpose**: Syncs data between Glide and Supabase with enhanced logging for `gl_estimate_lines`.

**Key Enhancements**:
- Fetches mapping details to identify the table being synced
- For `gl_estimate_lines` table:
  - Fetches a sample of the synced data
  - Extracts and logs the fields that were synced
  - Checks if only relationship fields (`rowid_` fields) are being synced
  - Logs warnings if important fields are missing
  - Creates detailed log entries with field-level information

**Implementation Details**:
- Uses the Glidebase pattern where relationships use `rowid_` fields referencing `glide_row_id` values
- Follows the standard upsert pattern for all tables
- Ensures proper error handling and logging

## Database Migration

A database migration script has been created to ensure all fields are properly synced for the `gl_estimate_lines` table:

**Location**: `docs/database/20250407_fix_gl_estimate_lines_sync.sql`

**Purpose**: Fixes issues where only `rowid` fields are being synced for `gl_estimate_lines`.

**Key Actions**:
1. Removes any foreign key constraints that are inconsistent with the Glidebase pattern
2. Ensures all expected columns exist in the `gl_estimate_lines` table
3. Creates proper indexes for relationship fields
4. Updates the `gl_mappings` table to include all fields in the mapping
5. Adds documentation comments to the table

## UI Components

### 1. `SyncLogsView` Component

**Location**: `src/components/sync/mappings/SyncLogsView.tsx`

**Purpose**: Displays detailed sync logs, including field-level information.

**Key Features**:
- Shows sync status (completed, error, warning)
- Displays the number of records processed
- Lists the fields that were synced
- Shows sample data for successful syncs
- Provides error details for failed syncs
- Allows users to refresh the logs

### 2. `SyncOverview` Component

**Location**: `src/components/sync/dashboard/SyncOverview.tsx`

**Purpose**: Provides an overview of sync operations, including detailed logs.

**Key Features**:
- Shows active mappings
- Displays sync status for each mapping
- Provides access to detailed sync logs
- Shows field-level information for sync operations

## Troubleshooting

### Common Issues

1. **Only `rowid` fields being synced**:
   - Check the `gl_mappings` table to ensure all fields are included in the mapping
   - Run the database migration script to fix the issue
   - Verify that the Glide table has all the expected fields

2. **Missing fields in sync logs**:
   - Check the `field_mappings` in the `gl_mappings` table
   - Ensure the fields exist in both Glide and Supabase tables
   - Verify that the sync operation is configured correctly

3. **Foreign key constraints causing sync failures**:
   - Remove foreign key constraints that are inconsistent with the Glidebase pattern
   - Use the database migration script to fix the issue
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
