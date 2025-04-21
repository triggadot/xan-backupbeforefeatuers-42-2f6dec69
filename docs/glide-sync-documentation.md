# Glide-to-Supabase Synchronization System Documentation

*Created: April 13, 2025*

## Overview

The Glide-to-Supabase synchronization system is a fully functional data pipeline that transfers data from Glide apps to Supabase PostgreSQL. This document describes the correct implementation that should be preserved when fixing build errors or making further enhancements.

## Architecture

The sync system follows a layered architecture with four key components:

1. **Frontend UI Components** - Dashboard & Sync Now button
2. **React Hook Layer** - Provides React-specific functionality
3. **Service Layer** - Handles API communication
4. **Edge Function** - Performs actual sync operations

![Sync Architecture Diagram](../assets/sync-architecture.png)

## Core Database Structure

The sync system relies on four essential tables:

### 1. gl_connections

Stores Glide API credentials and app settings:

```sql
CREATE TABLE gl_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL,
  api_key TEXT NOT NULL,
  app_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE
);
```

### 2. gl_mappings

Defines relationship between Glide and Supabase tables:

```sql
CREATE TABLE gl_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES gl_connections(id),
  glide_table TEXT NOT NULL,
  glide_table_display_name TEXT,
  supabase_table TEXT NOT NULL,
  column_mappings JSONB,
  sync_direction TEXT DEFAULT 'to_supabase',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. gl_sync_logs

Records sync operations and their results:

```sql
CREATE TABLE gl_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapping_id UUID NOT NULL REFERENCES gl_mappings(id),
  status TEXT NOT NULL,
  message TEXT,
  records_processed INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### 4. gl_sync_errors

Stores detailed error information for failed operations:

```sql
CREATE TABLE gl_sync_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapping_id UUID NOT NULL REFERENCES gl_mappings(id),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  record_data JSONB,
  is_retryable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Sync Flow (Glide to Supabase)

### 1. User Initiates Sync

- User navigates to `/sync/dashboard`
- Views mapping configuration in SyncDashboard component
- Clicks "Sync Now" button which triggers the sync operation

### 2. Hook Layer Processing

- `handleSync()` in SyncDashboard calls `syncMappingById(mappingId)`
- `useGlSync` hook handles React state management (loading, progress, errors)
- Hook delegates to the service layer for actual sync operations

### 3. Service Layer API Call

- `glSyncService.syncData()` makes a request to Supabase Edge Function
- Formats request body with action='syncMapping', connectionId, and mappingId
- Creates initial sync log entry for tracking the operation
- Handles success/failure responses and user notifications

### 4. Edge Function Execution

- Supabase Edge Function (`glsync`) receives the request
- Fetches mapping configuration from `gl_mappings` table
- Retrieves connection details from `gl_connections` table
- Connects to Glide API using credentials from connection record
- Fetches data from Glide using the table specified in mapping
- Transforms data according to column mappings (handling data types)
- Upserts transformed records to Supabase using `glide_row_id` as key
- Logs operation results in `gl_sync_logs` table
- Records any errors in `gl_sync_errors` table

### 5. Result Handling

- Edge function returns success/failure status and record counts
- Service layer updates UI state based on response
- Displays toast notification to user with operation result
- Updates last sync time in frontend display

## Key Features

1. **Data Type Transformation**: Converts between Glide and PostgreSQL data types
2. **Error Handling**: Comprehensive error capture and logging
3. **Audit Trail**: Complete logging of all sync activities
4. **Performance Optimization**: Processes data in batches for efficiency
5. **Relationship Handling**: Uses `rowid_` fields referencing `glide_row_id` values to maintain relationships

## Important Code Paths

### Frontend (Sync Now Button):

```tsx
// src/components/sync/dashboard/SyncDashboard.tsx
const handleSync = async () => {
  if (!mappingId) {
    toast({
      title: "No mapping selected",
      description: "Please select a mapping to sync",
      variant: "destructive"
    });
    return;
  }
  
  try {
    await syncMappingById(mappingId);
    
    // Update last sync time
    storeLastSyncTime(mappingId);
    
    toast({
      title: "Sync completed",
      description: "Data has been synchronized successfully"
    });
    
    // Refresh data
    refreshMappings();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    setError(errorMessage);
    
    toast({
      title: "Sync failed",
      description: errorMessage,
      variant: "destructive"
    });
  }
};
```

### React Hook (useGlSync):

```typescript
// src/hooks/gl-sync/useGlSync.ts
const syncMappingById = useCallback(async (
  mappingId: string,
  options: {
    logLevel?: 'minimal' | 'detailed',
    onProgress?: (progress: number) => void
  } = {}
): Promise<boolean> => {
  const { logLevel = 'detailed' } = options;
  setIsLoading(true);
  setError(null);
  
  try {
    // Get the connection ID from the mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('gl_mappings')
      .select('connection_id')
      .eq('id', mappingId)
      .single();
    
    if (mappingError || !mapping) {
      throw new Error(`Mapping not found: ${mappingError?.message || 'Unknown error'}`);
    }
    
    // Sync the data
    await syncData(mapping.connection_id, mappingId, { logLevel, onProgress: options.onProgress });
    
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(errorMessage);
    
    toast({
      title: 'Sync Error',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return false;
  } finally {
    setIsLoading(false);
  }
}, [syncData, toast]);
```

### Service Layer (glSyncService):

```typescript
// src/services/glsync.ts
async syncData(
  connectionId: string, 
  mappingId: string,
  options: {
    logLevel?: 'minimal' | 'detailed',
    onProgress?: (progress: number) => void
  } = {}
): Promise<SyncResult | null> {
  const { logLevel = 'detailed', onProgress } = options;
  const timer = logger.timer('syncData');
  
  logger.info(`Syncing data for mapping ${mappingId}`, {
    data: { connectionId, mappingId, logLevel }
  });
  
  try {
    // Create a sync log entry
    const logId = await this.createSyncLog(mappingId, 'started', 'Sync started');
    
    // Invoke the edge function
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'syncMapping',
        connectionId,
        mappingId,
        logLevel
      }
    });

    if (error) {
      logger.error(`Error syncing data:`, { data: error });
      
      // Update the sync log
      if (logId) {
        await this.updateSyncLog(logId, 'failed', `Sync failed: ${error.message}`);
      }
      
      throw error;
    }

    logger.info(`Sync completed successfully`, { data });
    
    // Update the sync log
    if (logId) {
      await this.updateSyncLog(
        logId, 
        'completed', 
        `Sync completed: ${data.recordsProcessed} records processed`, 
        data.recordsProcessed
      );
    }
    
    return data;
  } catch (err) {
    logger.error(`Exception in syncData:`, { data: err });
    throw err;
  } finally {
    timer.stop();
  }
}
```

### Edge Function (glsync):

```typescript
// supabase/functions/glsync/index.ts
async function syncData(supabase: any, connectionId: string, mappingId: string) {
  // Get the mapping
  const { data: mapping, error: mappingError } = await supabase
    .from('gl_mappings')
    .select('*')
    .eq('id', mappingId)
    .single();
  
  if (mappingError) {
    throw new Error(`Mapping not found: ${mappingError.message}`);
  }
  
  // Get the connection
  const { data: connection, error: connectionError } = await supabase
    .from('gl_connections')
    .select('*')
    .eq('id', connectionId)
    .single();
  
  if (connectionError) {
    throw new Error(`Connection not found: ${connectionError.message}`);
  }
  
  // Create a sync log entry
  const { data: logData } = await supabase
    .from('gl_sync_logs')
    .insert({
      mapping_id: mappingId,
      status: 'in_progress',
      message: 'Fetching data from Glide'
    })
    .select('id')
    .single();
  
  const logId = logData?.id;
  
  // Get the data from Glide
  const glideData = await fetchGlideTableData(
    connection.app_id, 
    connection.api_key, 
    mapping.glide_table
  );
  
  // Transform and insert the data
  const columnMappings = validateAndFixColumnMappings(mapping.column_mappings || {});
  const errors = [];
  const transformedRows = [];
  
  for (const row of glideData) {
    try {
      const transformedRow: Record<string, any> = {};
      
      // Map and transform each column
      for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
        const { glide_column_name, supabase_column_name, data_type } = mappingInfo;
        const value = row[glide_column_name];
        
        transformedRow[supabase_column_name] = transformValue(value, data_type);
      }
      
      // Validate the transformed row
      if (!validateColumnMappings(transformedRow, columnMappings, mappingId)) {
        continue;
      }
      
      transformedRows.push(transformedRow);
    } catch (err) {
      // Log the error
      errors.push({
        row,
        error: err instanceof Error ? err.message : String(err)
      });
      
      // Record the error in the database
      await supabase
        .from('gl_sync_errors')
        .insert({
          mapping_id: mappingId,
          error_type: 'TRANSFORM_ERROR',
          error_message: err instanceof Error ? err.message : String(err),
          record_data: row
        });
    }
  }
  
  // Insert the transformed rows into Supabase
  if (transformedRows.length > 0) {
    const { error: insertError } = await supabase
      .from(mapping.supabase_table)
      .upsert(transformedRows, {
        onConflict: 'glide_row_id',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      throw new Error(`Error inserting data: ${insertError.message}`);
    }
  }
  
  // Update the sync log
  await supabase
    .from('gl_sync_logs')
    .update({
      status: 'completed',
      message: `Sync completed: ${transformedRows.length} records processed`,
      records_processed: transformedRows.length,
      completed_at: new Date().toISOString()
    })
    .eq('id', logId);
  
  // Update connection's last_sync timestamp
  await supabase
    .from('gl_connections')
    .update({ 
      last_sync: new Date().toISOString() 
    })
    .eq('id', connectionId);
  
  return {
    success: true,
    recordsProcessed: transformedRows.length,
    failedRecords: errors.length,
    errors: errors.length > 0 ? errors : undefined
  };
}
```

## TypeScript Interfaces

When fixing build errors, maintain consistency with these core interfaces:

```typescript
// Key interfaces for the Glide sync system

interface GlConnection {
  id: string;
  app_id: string;
  api_key: string;
  app_name: string | null;
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
}

interface ColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: string;
}

interface GlMapping {
  id: string;
  connection_id: string;
  glide_table: string;
  glide_table_display_name?: string;
  supabase_table: string;
  column_mappings: Record<string, ColumnMapping>;
  sync_direction: 'to_supabase' | 'to_glide' | 'both';
  created_at?: string;
  updated_at?: string;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  failedRecords: number;
  errors?: Array<{
    row: Record<string, any>;
    error: string;
  }>;
}

interface SyncLog {
  id: string;
  mapping_id: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  records_processed?: number;
  started_at: string;
  completed_at?: string;
}

interface SyncError {
  id: string;
  mapping_id: string;
  error_type: string;
  error_message: string;
  record_data?: Record<string, any>;
  is_retryable: boolean;
  created_at: string;
}
```

## Deprecated Functionality

The following functionality is deprecated and should not be used:

1. **Manual relationship mapping**: Previously, relationships were manually mapped using a separate process. Now, relationships are automatically handled using the `rowid_` fields that reference `glide_row_id` values in related tables.

```typescript
// This function is deprecated and should not be used
const mapAllRelationships = async (tableFilter?: string): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> => {
  const deprecationMessage = 'The relationship mapping functionality has been deprecated. Relationships are now handled automatically during the sync process using rowid_ fields that reference glide_row_id values in related tables.';
  
  return { 
    success: false, 
    error: deprecationMessage,
    result: { deprecated: true }
  };
};
```

## Bidirectional Sync (Future Implementation)

The current implementation only handles sync from Glide to Supabase. A future implementation for Supabase to Glide sync using n8n is planned but not yet fully implemented. See the n8n implementation plan in other documentation for details.

## Troubleshooting Common Errors

1. **Missing `glide_row_id` field**: Ensure all tables being synced have a `glide_row_id` column of type TEXT.

2. **Connection errors**: Check that the API key and app ID are correct in the `gl_connections` table.

3. **Mapping errors**: Verify that column mappings are correctly set up, especially data types.

4. **Relationship errors**: Ensure that `rowid_` fields are correctly referencing `glide_row_id` values in related tables.

## Conclusion

This document describes the current working implementation of the Glide-to-Supabase sync system. When fixing build errors or making enhancements, ensure that this core functionality is preserved. The sync system is a critical component of the application and changes should be made with care.

---

**Document Version:** 1.0
**Last Updated:** April 13, 2025
**Author:** Cascade AI
