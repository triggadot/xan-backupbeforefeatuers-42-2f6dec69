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

- `SyncLayout.tsx` - Layout component providing navigation tabs for the sync feature
- `SyncDashboard.tsx` - Dashboard showing active mappings, statistics, and recent activity
- `MappingsManager.tsx` - Interface for managing table mappings between Glide and Supabase
- `ConnectionsManager.tsx` - Interface for managing Glide API connections
- `SyncLogs.tsx` - Display for synchronization logs

### Supporting Components

- `SyncContainer.tsx` - Container component for consistent layout of sync pages
- `SyncMetricsCard.tsx` - Display for sync metrics and statistics
- `SyncErrorDisplay.tsx` - Component for displaying and managing sync errors
- `MappingDetailsCard.tsx` - Card component displaying mapping details and actions

### UI Components (in the `ui` directory)

- `StatusDisplay.tsx` - Combined component providing ValidationDisplay and SyncStatusDisplay
- `StateDisplay.tsx` - Combined component for LoadingState, InvalidMapping, and EmptyState
- `SyncLogTable.tsx` - Table display for sync logs
- `SyncStatusBadge.tsx` - Badge showing sync status
- `StatusBadgeUtils.tsx` - Utilities for status badges
- `ErrorDisplay.tsx` - Component for displaying errors
- `ProgressIndicator.tsx` - Visual indicator for sync progress

### Organization by Feature

- **Mappings** - Components for table mapping functionality are in the `mappings/` subdirectory
- **Connections** - Connection management components are in the `connections/` subdirectory
- **Overview** - Dashboard components are in the `overview/` subdirectory

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

- Consolidated `SyncStatusDisplay` and `ValidationDisplay` into a unified `ui/StatusDisplay.tsx`
- Consolidated `LoadingState` and `InvalidMapping` into a unified `ui/StateDisplay.tsx` with additional `EmptyState`
- Removed product-specific components and pages in favor of the centralized sync architecture
- Standardized component organization using the principles above
- Improved component imports to reduce redundancy 