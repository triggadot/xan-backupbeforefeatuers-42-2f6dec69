# Code Organization Guidelines

This document provides comprehensive guidelines for organizing and structuring code in our project.

## Directory Structure

We follow a feature-based organization with some cross-cutting concerns separated into their own directories:

```
src/
├── components/       # UI components organized by feature and reusability
├── contexts/         # React contexts for global state
├── hooks/            # Custom React hooks
├── integrations/     # External service integrations
├── lib/              # Utility libraries and functions
├── pages/            # Page components that compose features
├── services/         # Service modules for external API calls
├── store/            # Zustand store definitions
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Component Organization

### Component Categories

1. **UI Components**: Reusable, presentational components
   - Location: `src/components/ui/`
   - Examples: Button, Card, Dialog

2. **Feature Components**: Specific to a particular feature
   - Location: `src/components/<feature>/`
   - Examples: ProductSyncPanel, ConnectionsManager

3. **Layout Components**: Structure the application's layout
   - Location: `src/components/layout/`
   - Examples: Sidebar, Navbar, Layout

4. **Common Components**: Shared across multiple features
   - Location: `src/components/common/`
   - Examples: DataTable, MetricCard

### Component File Structure

A component file should:

1. Import external dependencies
2. Import internal dependencies
3. Define types/interfaces
4. Define component
5. Export component

Example:
```tsx
// External imports
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal imports
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/format';

// Type definitions
interface UserCardProps {
  userId: string;
  showDetails?: boolean;
}

// Component definition
const UserCard: React.FC<UserCardProps> = ({ userId, showDetails = false }) => {
  // Implementation...
};

// Export
export default UserCard;
```

## Hook Organization

### Hook Categories

1. **Feature Hooks**: Encapsulate logic for specific features
   - Examples: `useGlSync`, `useGlSyncStatus`

2. **UI Hooks**: Support UI interactions
   - Examples: `useToast`, `useMobile`

3. **Data Hooks**: Manage data fetching and state
   - Examples: Repository pattern hooks

### Hook Naming

- Prefix with `use`
- Use camelCase
- Be descriptive about functionality
- Examples: `useGlSyncErrors`, `useGlSync`

### Hook Implementation Pattern

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useHookName(param1, param2) {
  // State definitions
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Main functionality in useCallback
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Implementation
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [param1, param2]);

  // Effect to trigger on mount or parameter change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Additional functions 
  const refetch = () => fetchData();

  // Return values and functions
  return {
    data,
    isLoading,
    error,
    refetch
  };
}
```

## Service Layer Organization

### Service Module Pattern

```typescript
import { supabase } from '@/integrations/supabase/client';
import { Entity } from '@/types';

export const entityService = {
  // Get all entities
  async getAll(): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data as Entity[];
  },

  // Get entity by ID
  async getById(id: string): Promise<Entity> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data as Entity;
  },

  // Other CRUD operations...
};
```

### Edge Function Implementation Pattern

```typescript
import { corsHeaders } from '../shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { param1, param2 } = await req.json();
    
    // Validate input
    if (!param1) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Perform business logic
    const result = await performOperation(param1, param2);
    
    // Return successful response
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle and return error
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Type Definition Organization

### Domain Types

```typescript
// Base entity type with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Domain entity
export interface Product extends BaseEntity {
  name: string;
  sku: string;
  price: number;
  // ...other fields
}
```

### API Types

```typescript
// Request type
export interface SyncRequestPayload {
  action: 'testConnection' | 'listGlideTables' | 'syncData';
  connectionId: string;
  mappingId?: string;
}

// Response type
export interface SyncResponsePayload {
  success: boolean;
  data?: any;
  error?: string;
}
```

### State Types

```typescript
// Component state
export interface FormState {
  isSubmitting: boolean;
  values: Record<string, any>;
  errors: Record<string, string>;
}

// Application state
export interface AppState {
  theme: 'light' | 'dark';
  user: User | null;
  isAuthenticated: boolean;
}
```

## Code Style

### General Principles

- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **SRP**: Single Responsibility Principle
- **Composition over Inheritance**

### Function Organization

1. Start with state declarations
2. Define event handlers and callbacks 
3. Define effects
4. Define render helpers
5. Return/render component

### Commenting Guidelines

- Comment "why", not "what" or "how"
- Use JSDoc for public APIs and functions
- Comment complex logic or business rules

```typescript
/**
 * Calculates the total price including tax
 * @param price - Base price
 * @param taxRate - Tax rate (decimal)
 * @returns The total price with tax
 */
function calculateTotalPrice(price: number, taxRate: number): number {
  // For government contracts, we need to apply a special calculation
  // due to regulation XYZ-123
  if (isGovernmentContract) {
    return price * (1 + taxRate) * GOV_MODIFIER;
  }
  
  return price * (1 + taxRate);
}
```

## Best Practices

### React Components

- Use functional components with hooks
- Keep components small and focused
- Destructure props
- Use TypeScript interfaces for props
- Use React.memo for pure components
- Implement error boundaries

### State Management

- Keep state as local as possible
- Derive state when possible
- Use Context appropriately (not for everything)
- Leverage React Query for server state

### Performance

- Virtualize long lists
- Memoize expensive calculations
- Implement proper dependency arrays for hooks
- Use code splitting and lazy loading

### Error Handling

- Implement proper error boundaries
- Use try/catch blocks appropriately
- Display user-friendly error messages
- Log detailed errors for debugging

## File Cleanup

The following files may be redundant and considered for removal or refactoring:

1. **Redundant API calls in components**:
   - Direct API calls should be moved to hooks or services

2. **Old sync-related files**:
   - Check for orphaned files related to previous sync implementations

3. **Unused utilities**:
   - Scan for utility functions that aren't imported anywhere

4. **Legacy Edge Functions**:
   - Check for outdated function implementations that have been replaced
