# Glide Sync Components

This directory contains components for the Glide Sync feature that facilitates bidirectional data synchronization between Glide applications and Supabase database.

## Organization Principles

The components follow these organization principles:

1. **DRY**: Don't Repeat Yourself
2. **KISS**: Keep It Simple, Stupid
3. **SRP**: Single Responsibility Principle
4. **Composition over Inheritance**

In functional components:
1. Start with state declarations
2. Define event handlers and callbacks 
3. Define effects
4. Define render helpers
5. Return/render component

## Component Structure

### Main Components

- `dashboard/SyncDashboard.tsx` - Consolidated dashboard showing active mappings, statistics, and recent activity
- `dashboard/SyncOverview.tsx` - Overview component showing sync status and active mappings
- `dashboard/SyncDock.tsx` - Control panel for sync operations with last sync time display
- `mappings/MappingsList.tsx` - Interface for managing table mappings between Glide and Supabase
- `tables/SyncDetailTable.tsx` - Enhanced table component for viewing and managing sync data

### Supporting Components

- `common/SyncContainer.tsx` - Container component for consistent layout of sync pages
- `mappings/SyncErrorsView.tsx` - Component for displaying and managing sync errors
- `mappings/SyncLogsView.tsx` - Display for synchronization logs

### UI Components (in the `ui` directory)

- `StatusDisplay.tsx` - Combined component providing ValidationDisplay and SyncStatusDisplay
- `StateDisplay.tsx` - Combined component for LoadingState, InvalidMapping, and EmptyState
- `SyncLogTable.tsx` - Table display for sync logs
- `SyncStatusBadge.tsx` - Badge showing sync status
- `StatusBadgeUtils.tsx` - Utilities for status badges
- `ErrorDisplay.tsx` - Component for displaying errors
- `ProgressIndicator.tsx` - Visual indicator for sync progress

### Organization by Feature

- **dashboard/** - Main dashboard components including SyncDashboard, SyncOverview, and SyncDock
- **mappings/** - Components for table mapping functionality
- **tables/** - Table display and management components
- **common/** - Shared components used across multiple features
- **utils/** - Utility functions and helpers for sync operations

## Component Relationship

1. The main page (`Sync.tsx`) uses `SyncLayout` as a wrapper
2. `SyncLayout` provides navigation and renders the appropriate component based on the current tab
3. Each main component (`SyncDashboard`, `MappingsManager`, `ConnectionsManager`, `SyncLogs`) uses `SyncContainer` for consistent layout
4. Supporting components are imported as needed by the main components

## Naming Conventions

- React components follow PascalCase naming (e.g., SyncDashboard)
- Files are named after the component they export
- Related components are grouped in subdirectories
- Glide-specific database entities use the `gl_` prefix

## Recent Improvements

- Consolidated duplicate dashboard components (`SyncDashboard` and `EnhancedSyncDashboard`) into a unified implementation
- Created a new directory structure to better organize components by feature
- Extracted common utility functions into a dedicated `syncUtils.ts` file
- Created a central index file to export all components in a clean, organized way
- Restored the SyncOverview component to ensure all functionality is preserved
- Removed redundant components and imports to reduce code duplication
- Added proper TypeScript typing and JSDoc documentation to utility functions
- Ensured consistent styling and UI patterns across all sync components