# Mutation Hooks Pattern

## Overview

This document defines the standard pattern for mutation hooks in our application. All mutation hooks should follow this pattern to ensure consistency, maintainability, and adherence to best practices.

## Core Principles

1. **Use the Service Layer**: Always use service modules from `@/services/supabase/tables` for database operations.
2. **Use React Query**: Implement all mutations with TanStack Query's `useMutation` hook.
3. **Consistent Naming**: Follow established naming conventions.
4. **Proper Cache Invalidation**: Invalidate and remove query cache appropriately.
5. **Type Safety**: Properly type all inputs and outputs.

## Standard Pattern

### Basic Structure

```typescript
/**
 * Hook for creating, updating, and deleting [entity]
 * @returns Mutation functions for [entity] operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { [Entity], [EntityFormData] } from '@/types/[entity]';
import { gl[Entity]Service } from '@/services/supabase/tables';

export function use[Entity]Mutation() {
  const queryClient = useQueryClient();

  // Create [entity] mutation
  const create[Entity] = useMutation({
    mutationFn: async (data: [EntityFormData]): Promise<[Entity]> => {
      return await gl[Entity]Service.create[Entity](data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[entities]'] });
    },
    onError: (error) => {
      console.error('Error creating [entity]:', error);
    }
  });

  // Update [entity] mutation
  const update[Entity] = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<[EntityFormData]> }): Promise<[Entity]> => {
      return await gl[Entity]Service.update[Entity](id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['[entities]'] });
      queryClient.invalidateQueries({ queryKey: ['[entity]', variables.id] });
    },
    onError: (error) => {
      console.error('Error updating [entity]:', error);
    }
  });

  // Delete [entity] mutation
  const delete[Entity] = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await gl[Entity]Service.delete[Entity](id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['[entities]'] });
      queryClient.removeQueries({ queryKey: ['[entity]', id] });
    },
    onError: (error) => {
      console.error('Error deleting [entity]:', error);
    }
  });

  return {
    create[Entity],
    update[Entity],
    delete[Entity],
    isLoading: create[Entity].isPending || update[Entity].isPending || delete[Entity].isPending,
    error: create[Entity].error || update[Entity].error || delete[Entity].error
  };
}
```

## Detailed Guidelines

### 1. Service Layer Integration

All database operations must go through the service layer:

```typescript
// ✅ CORRECT: Using service layer
const product = await glProductsService.createProduct(data);

// ❌ INCORRECT: Direct database access
const { data, error } = await supabase.from("gl_products").insert(data);
```

### 2. React Query Implementation

Use the `useMutation` hook from TanStack Query for all mutations:

```typescript
// ✅ CORRECT: Using useMutation
const createProduct = useMutation({
  mutationFn: async (data) => {
    return await glProductsService.createProduct(data);
  },
  // ...
});

// ❌ INCORRECT: Manual state management
const [isLoading, setIsLoading] = useState(false);
const createProduct = async (data) => {
  setIsLoading(true);
  try {
    // ...
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Cache Invalidation

Properly invalidate queries after mutations:

```typescript
// ✅ CORRECT: Proper cache invalidation
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
},

// For deletion, remove the specific query from cache
onSuccess: (_, id) => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.removeQueries({ queryKey: ['product', id] });
},
```

### 4. Error Handling

Implement consistent error handling:

```typescript
onError: (error) => {
  console.error('Error creating product:', error);
  // Optionally show a toast/notification
},
```

### 5. Return Values

Each mutation hook should return a consistent interface:

```typescript
return {
  createEntity,
  updateEntity,
  deleteEntity,
  isLoading:
    createEntity.isPending || updateEntity.isPending || deleteEntity.isPending,
  error: createEntity.error || updateEntity.error || deleteEntity.error,
};
```

## Example: useProductMutation.ts

```typescript
/**
 * Hook for creating, updating, and deleting products
 * @returns Mutation functions for product operations
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, ProductFormData } from "@/types/products";
import { glProductsService } from "@/services/supabase/tables";

export const useProductMutation = () => {
  const queryClient = useQueryClient();

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (productData: ProductFormData): Promise<Product> => {
      const newProduct = await glProductsService.createProduct({
        ...productData,
        name: productData.name || "Unnamed Product",
      });

      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProductFormData>;
    }): Promise<Product> => {
      const updatedProduct = await glProductsService.updateProduct(id, data);

      return updatedProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await glProductsService.deleteProduct(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.removeQueries({ queryKey: ["product", id] });
    },
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
```

## Integration with Components

When using mutation hooks in components:

```tsx
function ProductForm() {
  const { createProduct, isLoading } = useProductMutation();

  const onSubmit = async (data) => {
    await createProduct.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## Migration Checklist

When migrating existing mutation hooks:

1. Replace direct Supabase client calls with service layer methods
2. Convert to React Query's `useMutation` pattern
3. Implement proper cache invalidation
4. Add consistent error handling
5. Maintain backward compatibility with consuming components
6. Add proper TypeScript types

## Benefits

Following this pattern provides several benefits:

- **Separation of Concerns**: Database logic stays in the service layer
- **Type Safety**: TypeScript ensures correct data structures
- **Automatic Loading State**: React Query handles loading states
- **Optimistic Updates**: Can be easily implemented with React Query
- **Consistent Error Handling**: Standardized approach to errors
- **Cache Management**: Automatic invalidation of stale data
- **Testability**: Easier to mock services for testing
- **Maintainability**: Consistent code patterns across the application
