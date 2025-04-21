# Telegram Product Matching: Frontend Components

## Component Architecture

The frontend implementation follows a feature-based organization pattern, with components organized by domain rather than technical role. All components are built using React 18+, TypeScript 5+, and styled with Tailwind CSS and shadcn/ui components.

### Directory Structure

```
src/
├── features/
│   └── telegram/
│       └── product-matching/
│           ├── components/         # Reusable UI components
│           ├── pages/              # Page-level components
│           └── index.ts            # Exports
├── hooks/
│   └── telegram/                  # Custom hooks
└── types/
    └── telegram/                  # TypeScript definitions
```

## React Hooks

### `useProductApprovalQueue`

Hook for fetching and managing products in the approval queue.

```typescript
const {
  data,           // Queue items with pagination
  isLoading,      // Loading state
  isError,        // Error state
  error,          // Error details
  refetch         // Function to refresh data
} = useProductApprovalQueue({
  status: 'pending',            // Filter by approval status
  limit: 20,                   // Items per page
  offset: 0,                   // Pagination offset
  search: 'search term',       // Optional search filter
  dateFrom: '2025-01-01',      // Optional date range start
  dateTo: '2025-12-31',        // Optional date range end
  vendorId: 'vendor123'        // Optional vendor filter
});
```

### `useApproveProduct`

Hook for approving product matches.

```typescript
const approveProduct = useApproveProduct();

// Usage
approveProduct.mutate(
  { queueId: 'queue-item-id', productId: 'product-id' },
  {
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  }
);
```

### `useRejectProduct`

Hook for rejecting product matches.

```typescript
const rejectProduct = useRejectProduct();

// Usage
rejectProduct.mutate(
  { queueId: 'queue-item-id', reason: 'Optional rejection reason' },
  {
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  }
);
```

### `useBatchApprovalOperations`

Hook for performing batch operations on multiple queue items.

```typescript
const batchOperations = useBatchApprovalOperations();

// Usage for batch approval
batchOperations.mutate({
  queueIds: ['id1', 'id2', 'id3'], 
  action: 'approve',
  productId: 'product-id'
});

// Usage for batch rejection
batchOperations.mutate({
  queueIds: ['id1', 'id2', 'id3'], 
  action: 'reject',
  reason: 'Optional rejection reason'
});
```

### `useCreateProductFromQueue`

Hook for creating new products from queue items.

```typescript
const createProduct = useCreateProductFromQueue();

// Usage
createProduct.mutate({
  queueId: 'queue-item-id',
  productData: {
    product_name: 'New Product',
    vendor_id: 'vendor-id',
    purchase_date: '2025-04-12',
    // Other product fields...
  }
});
```

## UI Components

### Core Components

#### `ProductMatchingDashboard`

Main page component for the product matching admin interface.

**Features:**
- Tabbed interface with grid and drag-and-drop views
- Filtering and search functionality
- Batch operations for multiple items
- Pagination for large result sets

**Usage:**
```tsx
<ProductMatchingDashboard />
```

#### `DraggableApprovalQueue`

Drag-and-drop interface for matching products.

**Features:**
- Intuitive drag-and-drop with visual feedback
- Drop zones for approve, reject, and create actions
- Vendor-based grouping

**Usage:**
```tsx
<DraggableApprovalQueue 
  items={items}
  potentialMatches={potentialMatches}
  onApprove={handleApprove}
  onReject={handleReject}
  onCreateProduct={handleCreateProduct}
  isProcessing={isLoading}
/>
```

#### `ProductDetailView`

Detailed view for reviewing product matches.

**Features:**
- High-resolution media preview
- Match confidence and reasons
- Tabbed interface for details and potential matches

**Usage:**
```tsx
<ProductDetailView 
  item={queueItem}
  isOpen={isDetailOpen}
  onClose={handleClose}
  onApprove={handleApprove}
  onReject={handleReject}
  potentialMatches={potentialMatches}
/>
```

#### `ProductCreationForm`

Form for creating new products from media.

**Features:**
- React Hook Form with Zod validation
- Pre-populated with detected information
- Media preview

**Usage:**
```tsx
<ProductCreationForm
  queueItem={queueItem}
  isOpen={isFormOpen}
  onClose={handleClose}
  onSubmit={handleCreateProduct}
  isSubmitting={isSubmitting}
/>
```

### Supporting Components

#### `ConfidenceScoreBadge`

Visual indicator for match confidence levels.

```tsx
<ConfidenceScoreBadge score={85} />
// or
<ConfidenceScoreBadge confidenceLevel="medium" />
```

#### `BatchApprovalPanel`

Interface for managing batch operations.

```tsx
<BatchApprovalPanel 
  selectedItems={selectedItemIds}
  items={queueItems}
  onApproveAll={handleBatchApprove}
  onRejectAll={handleBatchReject}
/>
```

#### `SortableQueueItem`

Draggable card for queue items.

```tsx
<SortableQueueItem 
  item={queueItem}
  onClick={handleItemClick}
/>
```

#### `ProductDropZone`

Drop target for drag-and-drop operations.

```tsx
<ProductDropZone 
  id="approve-zone"
  title="Approve"
  description="Drop items here to approve"
  items={approvedItems}
  onItemClick={handleItemClick}
  className="border-green-200 bg-green-50"
/>
```

## TypeScript Types

### Core Types

```typescript
// Confidence level for product matches
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Match type classification
export type MatchType = 'exact' | 'fuzzy' | 'manual' | 'auto';

// Status of items in the approval queue
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_matched';

// Represents a product match with confidence score and reasoning
export interface ProductMatch {
  id: string;
  glide_row_id: string;
  vendor_product_name: string;
  new_product_name?: string;
  display_name?: string;
  product_purchase_date?: string;
  match_score: number;
  match_reasons: {
    vendor_matched: boolean;
    purchase_date_match?: string;
    product_name_match?: string;
    purchase_order_match: boolean;
  };
}

// Product data for creating new products
export interface NewProductData {
  product_name: string;
  vendor_id?: string;
  purchase_date?: string;
  purchase_order_id?: string;
  product_code?: string;
  description?: string;
  category?: string;
  price?: number;
}
```

## State Management

State management follows a clear pattern according to the user's tech stack preferences:

1. **Server State**: Managed with React Query (TanStack Query)
   - Used for all data fetching and mutations
   - Handles caching, refetching, and optimistic updates

2. **Local UI State**: Managed with React's useState and useReducer
   - Modal states (open/closed)
   - Selected items
   - Form inputs

## Performance Optimizations

- Virtualized lists for large datasets
- Pagination for API requests
- Memoization with useMemo and useCallback
- Debounced search inputs
- Optimistic UI updates for a responsive feel

## Accessibility

The UI is built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader friendly text alternatives
