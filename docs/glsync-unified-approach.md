# Unified GlSync Architecture

## Overview

This document outlines the unified approach to Glide synchronization in the Glidebase system. Following the DRY (Don't Repeat Yourself) principle, we've consolidated all sync functionality into a single service with a thin React hook wrapper.

## Architecture

### 1. Core Components

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

### 2. Key Operations

All tables, including estimates and estimate lines, use the same standard upsert approach:

```typescript
const { error } = await supabase
  .from(mapping.supabase_table)
  .upsert(batch, { 
    onConflict: 'glide_row_id',
    ignoreDuplicates: false
  });
```

### 3. Sync Flow

1. Component calls `syncMappingById` from `useGlSync`
2. Hook retrieves connection ID from the mapping
3. Hook calls `syncData` with connection ID and mapping ID
4. Service makes API call to edge function
5. Edge function fetches data from Glide and inserts into Supabase
6. Results are returned with timing and processing information
7. Hook displays success/error toast messages

### 4. Relationship Handling

- Relationships use `rowid_` fields to reference `glide_row_id` values
- No foreign key constraints are used to allow flexibility in sync order
- Relationship integrity is maintained through application logic and database triggers

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

## Benefits of the Unified Approach

1. **Consistency**: All tables use the same sync approach
2. **Maintainability**: Single source of truth for sync logic
3. **Performance**: Optimized batch processing and error handling
4. **Reliability**: Comprehensive logging and error reporting
5. **Flexibility**: Supports various sync scenarios (single table, batch, etc.)

## Deprecated Approaches

The following approaches have been deprecated and should not be used:

- Special handling for estimates and estimate lines
- Custom database functions like `glsync_estimate_lines_complete`
- Multiple hooks with overlapping functionality
