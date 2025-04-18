# Purchase Order Types Migration Guide

## Overview

We are migrating purchase order types from the old location (`src/types/purchase-order.ts`) to a consolidated format in the new location (`src/types/purchase-orders/index.ts`). This guide outlines the transition strategy.

## Current Status

The purchase order components currently use types from `@/types/purchase-order` which have some inconsistencies in naming conventions (mix of camelCase and snake_case).

The new type system in `@/types/purchase-orders/index.ts` offers better organization and documentation, but requires updating component property references.

## Components That Need Migration

1. **src/components/new/purchase-orders/PurchaseOrderDetailView.tsx**
   - Currently using old type imports and property naming
   - Has a mix of camelCase and snake_case property references
   - Initial attempt to migrate resulted in numerous linter errors
   - Requires careful migration since it's a complex component
   - **TODO**: Create a dedicated task for this migration

## Migration Strategy

### Immediate Action Items

1. **For new components**: Use the new consolidated types from `@/types/purchase-orders` directly:

   ```typescript
   import { PurchaseOrder, PurchaseOrderLineItem, VendorPayment } from '@/types/purchase-orders';
   ```

2. **For existing components**: Keep using the original types temporarily to prevent breaking changes:

   ```typescript
   import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchase-order';
   ```

3. **Gradual refactoring**: When updating a component substantially, migrate it to use the new types and update property references as needed.

### Property Name Mapping

| Old Property (snake_case) | New Property (camelCase) |
|---------------------------|--------------------------|
| `po_number`               | `number`                 |
| `vendor_name`             | `vendorName`             |
| `total_amount`            | `totalAmount`            |
| `total_paid`              | `totalPaid`              |
| `total_cost`              | `totalCost`              |
| `line_items`              | `lineItems`              |
| `vendor_product_name`     | `vendorProductName`      |
| `new_product_name`        | `newProductName`         |
| `display_name`            | `displayName`            |
| `unit_price`              | `unitPrice`              |

### Future Improvements

1. Consider adding type aliases or utility functions to ease the transition.
2. Create comprehensive Jest tests to ensure type compatibility during migration.
3. Add ESLint rules to enforce the new property naming conventions.

## Timeline

- **Phase 1 (Current)**: Document migration strategy, prepare new types
- **Phase 2**: Gradually update components when substantial changes are needed
- **Phase 3**: Complete migration of all components to use new types
- **Phase 4**: Remove deprecated types and cleanup

## Examples

### Before:

```tsx
import { PurchaseOrder } from '@/types/purchase-order';

function MyComponent({ purchaseOrder }: { purchaseOrder: PurchaseOrder }) {
  return (
    <div>
      <h1>{purchaseOrder.po_number}</h1>
      <p>Total: {purchaseOrder.total_amount}</p>
      {purchaseOrder.line_items.map(item => (
        <div key={item.id}>
          <p>{item.vendor_product_name}</p>
          <p>{item.unit_price}</p>
        </div>
      ))}
    </div>
  );
}
```

### After:

```tsx
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchase-orders';

function MyComponent({ purchaseOrder }: { purchaseOrder: PurchaseOrder }) {
  return (
    <div>
      <h1>{purchaseOrder.number}</h1>
      <p>Total: {purchaseOrder.totalAmount}</p>
      {purchaseOrder.lineItems.map(item => (
        <div key={item.id}>
          <p>{item.vendorProductName}</p>
          <p>{item.unitPrice}</p>
        </div>
      ))}
    </div>
  );
}
``` 