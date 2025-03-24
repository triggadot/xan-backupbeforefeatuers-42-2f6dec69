# Hook Consolidation

This document outlines the consolidation of overlapping React hooks in the codebase to improve maintainability and reduce duplication.

## Consolidated Hooks

### 1. `useGlSync` and `useSyncData`

Both hooks provided functionality for data synchronization between Glide and Supabase. We've consolidated them into an enhanced `useGlSync` hook that supports both approaches:

```typescript
// Enhanced useGlSync with both direct API and Supabase function call support
const { syncData } = useGlSync();

// Call with direct API (default)
await syncData(connectionId, mappingId);

// Call with Supabase function invocation (matches original useSyncData)
await syncData(connectionId, mappingId, false);
```

### 2. `useGlSyncValidation` and `useColumnMappingValidation`

Both hooks provided validation functionality for mappings. We've consolidated them into an enhanced `useGlSyncValidation` hook that supports both validation by ID and by data object:

```typescript
// Enhanced useGlSyncValidation with both approaches
const { validateMappingConfig, validateMapping } = useGlSyncValidation();

// Validate by mapping ID (original useGlSyncValidation)
await validateMappingConfig(mappingId);

// Validate by mapping data object (original useColumnMappingValidation)
await validateMapping(mappingData);
```

## Backward Compatibility

We've maintained backward compatibility through adapter hooks:

1. `useSyncData` - Now uses `useGlSync` internally
2. `useColumnMappingValidation` - Now uses `useGlSyncValidation` internally

These adapter hooks maintain the same API as the original hooks, making the transition seamless.

## Benefits

1. **Reduced code duplication** - Common functionality is now in one place
2. **Consistent error handling** - One approach for managing loading states and errors
3. **Simplified maintenance** - Changes only need to be made in one location
4. **Improved testability** - Core functionality is centralized and easier to test

## Implementation Details

### Enhanced Hooks:

- `useGlSync`: Added support for direct API calls and Supabase function calls
- `useGlSyncValidation`: Added support for validation by ID and by data object

### Adapter Hooks:

- `useSyncData`: Thin wrapper around `useGlSync` with `useDirect=false`
- `useColumnMappingValidation`: Thin wrapper around `useGlSyncValidation` that calls `validateMapping`

### Testing

Comprehensive tests have been added for all hooks, verifying both the enhanced functionality and the backward compatibility through adapter hooks. 