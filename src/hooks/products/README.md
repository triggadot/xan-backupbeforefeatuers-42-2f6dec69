# Product Hooks Documentation

This document provides detailed information about the product-related hooks in the application, including their purpose, parameters, return values, and usage examples.

## Table of Contents

1. [useProducts](#useproducts)
2. [useProductDetail](#useproductdetail)
3. [useProductMutation](#useproductmutation)
4. [useProductVendors](#useproductvendors)

## useProducts

Fetches a list of products with optional filtering capabilities.

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| options | `Object` | Optional configuration options | No |
| options.filters | `ProductFilters` | Filters to apply to the product list | No |
| options.includeAccounts | `boolean` | Whether to include account (vendor) information | No |

### Return Value

```typescript
{
  data: Product[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<Product[], Error>>;
}
```

### Usage Example

```typescript
import { useProducts } from '@/hooks/products';

// Basic usage - fetch all products
const { data: products, isLoading, error } = useProducts();

// With filters
const { data: filteredProducts } = useProducts({
  filters: {
    category: 'Electronics',
    searchTerm: 'laptop'
  }
});

// Include account information
const { data: productsWithVendors } = useProducts({
  includeAccounts: true
});
```

### Edge Cases

- If no products match the filters, an empty array is returned
- If an error occurs during fetching, the error object will contain details
- Account information is only included if `includeAccounts` is true

## useProductDetail

Fetches detailed information about a specific product, including its relationships with other entities.

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| productId | `string \| undefined` | The glide_row_id of the product to fetch | Yes |
| options | `Object` | Optional configuration options | No |
| options.includeRelationships | `boolean` | Whether to include related entities (invoices, purchase orders, etc.) | No |

### Return Value

```typescript
{
  data: Product | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<Product, Error>>;
}
```

### Usage Example

```typescript
import { useProductDetail } from '@/hooks/products';

// Fetch a specific product with all relationships
const { data: product, isLoading, error } = useProductDetail('product-123');

// Fetch without relationships (faster)
const { data: basicProduct } = useProductDetail('product-123', {
  includeRelationships: false
});
```

### Edge Cases

- If `productId` is undefined, the query will not execute
- If the product doesn't exist, error will be populated
- Related entities are only fetched if `includeRelationships` is true or undefined

## useProductMutation

Provides functions for creating, updating, and deleting products with proper cache invalidation.

### Return Value

```typescript
{
  createProduct: UseMutationResult<Product, Error, ProductFormData>;
  updateProduct: UseMutationResult<Product, Error, { id: string; data: Partial<ProductFormData> }>;
  deleteProduct: UseMutationResult<void, Error, string>;
}
```

### Usage Example

```typescript
import { useProductMutation } from '@/hooks/products';

function ProductForm() {
  const { createProduct, updateProduct, deleteProduct } = useProductMutation();
  
  // Create a new product
  const handleCreate = async (data) => {
    try {
      await createProduct.mutateAsync(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
  
  // Update an existing product
  const handleUpdate = async (id, data) => {
    try {
      await updateProduct.mutateAsync({ id, data });
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
  
  // Delete a product
  const handleDelete = async (id) => {
    try {
      await deleteProduct.mutateAsync(id);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
}
```

### Edge Cases

- All mutation functions handle cache invalidation automatically
- Optimistic updates are applied for better UX
- Error handling is delegated to the consumer

## useProductVendors

Fetches vendors that provide products and their relationship statistics.

### Return Value for useProductVendors

```typescript
{
  data: Account[] | undefined;  // Accounts with product_count property
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<Account[], Error>>;
}
```

### Return Value for useProductVendorDetail

```typescript
{
  data: {
    ...Account;
    products: Product[];
    totalValue: number;
    categories: string[];
    productCount: number;
  } | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<VendorDetail, Error>>;
}
```

### Usage Example

```typescript
import { useProductVendors, useProductVendorDetail } from '@/hooks/products';

// Get all vendors with product counts
const { data: vendors } = useProductVendors();

// Get detailed information about a specific vendor
const { data: vendorDetail } = useProductVendorDetail('vendor-123');
```

### Edge Cases

- If no vendors have products, an empty array is returned
- For vendor detail, if vendorId is undefined, the query will not execute
- The vendor detail includes aggregated statistics like total value and product count

## Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ useProducts │     │useProductDet│     │useProductMut│
│             │     │    ail      │     │   ation     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Supabase Client                    │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Supabase Database                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Implementation Notes

- All hooks use TanStack Query for data fetching and state management
- Relationships between entities follow the Glidebase pattern using `rowid_` fields
- Manual joins are implemented since the database doesn't use actual foreign key constraints
- Stale time is set to 5 minutes for most queries to reduce unnecessary refetches
