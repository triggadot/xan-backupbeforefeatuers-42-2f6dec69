# Project Knowledge Base

This document serves as the central reference for our project architecture, naming conventions, and best practices. It should be referenced when adding new features or making changes to existing code.

## Table of Contents
1. [Naming Conventions](#naming-conventions)
2. [Project Structure](#project-structure)
3. [Database Conventions](#database-conventions)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Data Fetching](#data-fetching)
7. [Type Definitions](#type-definitions)
8. [Supabase Integration](#supabase-integration)
9. [Sync Architecture](#sync-architecture)
10. [Error Handling](#error-handling)
11. [Performance Optimization](#performance-optimization)

## Naming Conventions

### Files and Directories
- **React Components**: `PascalCase.tsx` (e.g., `Button.tsx`, `DataTable.tsx`)
- **React Hooks**: `useHookName.ts` (camelCase with "use" prefix, e.g., `useGlSync.ts`)
- **Context Providers**: `PascalCaseProvider.tsx` (e.g., `AuthProvider.tsx`)
- **Type Definitions**: `PascalCase.ts` or `index.ts` in a types directory (e.g., `types/glsync.ts`)
- **Utility Functions**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Services**: `camelCase.ts` (e.g., `dbService.ts`)
- **Pages**: `PascalCase.tsx` (e.g., `Dashboard.tsx`, `ProductSync.tsx`)
- **Edge Functions**: Folder in kebab-case, index.ts file (e.g., `supabase/functions/glsync/index.ts`)
- **CSS/SCSS**: Same name as component with `.css`/`.scss` extension (e.g., `Button.css`)

### Code Style
- **React Components**: PascalCase (e.g., `const Button = () => {}`)
- **Functions**: camelCase (e.g., `const formatCurrency = () => {}`)
- **Variables**: camelCase (e.g., `const userName = 'John'`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `const MAX_RETRIES = 3`)
- **Interfaces/Types**: PascalCase (e.g., `interface UserProfile {}`)
- **CSS Classes**: kebab-case (though Tailwind is primarily used)
- **Event Handlers**: Prefix with `handle` (e.g., `handleSubmit`, `handleClick`)

## Project Structure

```
project-root/
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared components (DataTable, Card, etc.)
│   │   ├── layout/       # Layout components (Navbar, Sidebar, etc.)
│   │   ├── ui/           # UI components from shadcn 
│   │   └── sync/         # Feature-specific components for sync functionality
│   ├── contexts/         # React contexts for global state
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External integrations
│   │   └── supabase/     # Supabase client and types
│   ├── lib/              # Utility libraries and functions
│   ├── pages/            # Page components
│   ├── services/         # Service modules for external API calls
│   ├── store/            # Zustand store definitions
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── supabase/
│   ├── functions/        # Supabase Edge Functions
│   │   ├── glsync/       # Main sync function
│   │   └── shared/       # Shared utilities (CORS, Glide API, etc.)
│   └── config.toml       # Supabase configuration
├── public/               # Static files
└── docs/                 # Documentation
```

## Database Conventions

### Table Naming
- Prefix all Glide-related tables with `gl_` (e.g., `gl_products`, `gl_connections`)
- Use snake_case for table names
- Use plural form for table names (e.g., `gl_products` not `gl_product`)

### Column Naming
- Use snake_case for column names
- Standard columns in all tables:
  - `id`: UUID primary key with DEFAULT gen_random_uuid()
  - `created_at`: Timestamp with DEFAULT now()
  - `updated_at`: Timestamp (updated via trigger)
  - `glide_row_id`: For tables synced with Glide, this is the unique identifier in Glide

### Glide-Specific Conventions
- All tables synced with Glide should have `glide_row_id` as a unique identifier
- Column mappings between Supabase and Glide are stored in the `gl_mappings` table
- All database functions, triggers, and views related to Glide sync should be prefixed with `gl_`

## Component Architecture

### Component Organization
- Components are categorized by functionality and reusability
- Self-contained components with their own logic, styling, and tests
- Composition over inheritance
- Props should be typed using TypeScript interfaces
- Use of React hooks for stateful logic

### Best Practices
- Keep components small and focused (< 300 lines)
- Extract complex logic into custom hooks
- Use destructuring for props
- Implement proper error boundaries
- Minimize use of inline styles in favor of Tailwind classes
- Prefer functional components with hooks over class components

## State Management

### Local State
- Use React's `useState` for component-level state
- Extract complex state logic into custom hooks

### Global State
- Use React Context API for theme, auth, and other app-wide state
- Leverage Zustand for more complex state management needs
- Use React Query for server state management

### Best Practices
- Keep state as local as possible
- Derive state when possible instead of duplicating
- Separate UI state from data state
- Avoid prop drilling by using context or state management libraries

## Data Fetching

### Patterns
- Use React Query (`useQuery`, `useMutation`) for data fetching
- Implement proper loading, error, and success states
- Use SWR (stale-while-revalidate) pattern for automatic revalidation
- Cache responses appropriately to reduce unnecessary network requests

### Naming Conventions
- Query hook naming: `useEntity[Action]` (e.g., `useGlSyncStatus`, `useGlSyncErrors`)
- Service functions: `verbNoun` (e.g., `fetchGlideTableData`, `sendGlideMutations`)

## Type Definitions

### Organization
- Store shared types in `src/types/`
- Group related types in feature-specific files (e.g., `glsync.ts` for Glide sync types)
- Use extending interfaces for related types

### Best Practices
- Define base interfaces that are extended by specific entities
- Use union types for state management (e.g., `'idle' | 'loading' | 'success' | 'error'`)
- Export types from a central location
- Use TypeScript's utility types when appropriate (Partial, Pick, Omit, etc.)

### Example
```typescript
// Base entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Specific entity extending base
export interface Product extends BaseEntity {
  name: string;
  // ...other fields
}
```

## Supabase Integration

### Edge Functions
- Organized in `supabase/functions/` directory
- Each function in its own directory with an `index.ts` entry point
- Shared utilities in the `shared/` directory
- Follow the pattern:
  1. Parse request
  2. Validate input
  3. Perform business logic
  4. Return formatted response with appropriate headers

### Client Usage
- Import the Supabase client from `@/integrations/supabase/client`
- Handle errors appropriately
- Use RLS (Row Level Security) policies for data access control
- Implement retry logic for network failures

### CORS Handling
- Use the shared CORS utilities in `supabase/functions/shared/cors.ts`
- Include proper headers for all responses
- Handle OPTIONS requests correctly

## Sync Architecture

### Data Flow
```
UI Component → React Hook → Edge Function → Glide API → Database
```

### Key Components
1. **UI Layer**: React components for user interaction
2. **Data Layer**: Custom hooks interfacing with the Supabase client
3. **API Layer**: Edge Functions handling business logic and external API calls
4. **Storage Layer**: Database tables and views

### Synchronization Process
1. **Configuration**: Set up connections and mappings
2. **Validation**: Ensure data integrity between systems
3. **Transformation**: Convert data between formats
4. **Storage**: Persist synchronized data
5. **Error Handling**: Record and report sync issues

## Error Handling

### Frontend
- Use React Query's error handling capabilities
- Implement error boundaries for component-level errors
- Display user-friendly error messages with toast notifications
- Log detailed errors to console in development

### Backend
- Structured error responses with appropriate HTTP status codes
- Detailed error logging
- Implement retry mechanisms for transient failures
- Track and persist errors in database for debugging (gl_sync_errors)

## Performance Optimization

### React Performance
- Use React.memo for pure components
- Implement useMemo and useCallback for expensive calculations and callbacks
- Virtualize long lists with react-window or similar libraries
- Code-splitting with lazy loading for large components

### Network Optimization
- Implement proper caching strategies
- Use pagination for large datasets
- Batch API requests when possible
- Implement debouncing for user input

### Database Performance
- Use indexes for frequently queried columns
- Optimize queries with proper WHERE clauses
- Use views for complex joined queries
- Implement database functions for common operations

---

This document is a living reference and should be updated as the project evolves and new patterns emerge.
