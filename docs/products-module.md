# Products Module Documentation

## Overview

The Products module manages product data in the Glidebase system, providing functionality for creating, reading, updating, and deleting products. Products are linked to purchase orders, invoices, estimates, and vendor payments using the Glidebase relationship pattern.

## Data Model

### Core Product Structure

Products are stored in the `gl_products` table with the following key fields:

```typescript
interface Product {
  // Core Glidebase fields
  id: uuid;                      // Primary key
  glide_row_id: string;          // Unique identifier used for relationships
  rowid_accounts: string;        // References vendor's glide_row_id
  rowid_vendor_payments: string; // References vendor payment's glide_row_id
  rowid_purchase_orders: string; // References purchase order's glide_row_id
  
  // Display fields
  vendor_product_name: string;   // Original product name from vendor
  new_product_name: string;      // Custom product name
  display_name: string;          // Generated field (COALESCE(new_product_name, vendor_product_name))
  category: string;              // Product category
  
  // Financial fields
  cost: number;                  // Unit cost
  total_qty_purchased: number;   // Total quantity purchased
  
  // Special product flags
  samples: boolean;              // Whether this is a sample product
  fronted: boolean;              // Whether this product was fronted
  miscellaneous_items: boolean;  // Whether this is a miscellaneous item
  terms_for_fronted_product: string; // Terms for fronted products
  total_units_behind_sample: number; // Units behind sample
  
  // Dates and metadata
  product_purchase_date: timestamp;  // When the product was purchased
  purchase_notes: string;            // Notes about the purchase
  product_image1: string;            // Product image URL
  created_at: timestamp;             // Creation timestamp
  updated_at: timestamp;             // Last update timestamp
}
```

### Relationships

Products follow the Glidebase relationship pattern where:

1. Foreign key relationships use `rowid_[table]` fields that reference the `glide_row_id` field in the target table
2. No actual foreign key constraints are implemented in the database
3. Relationships are maintained through application logic and database triggers

Key relationships:
- `gl_products.rowid_accounts` → references `gl_accounts.glide_row_id` (vendor)
- `gl_products.rowid_purchase_orders` → references `gl_purchase_orders.glide_row_id`
- `gl_invoice_lines.rowid_products` → references `gl_products.glide_row_id`
- `gl_estimate_lines.rowid_products` → references `gl_products.glide_row_id`

## Components

### Pages

- **Products.tsx**: Main products page that displays the product list, filters, and summary cards

### Components

- **ProductsTable.tsx**: Displays a table of products with sorting, filtering, and action buttons
- **ProductDetails.tsx**: Shows detailed information about a product, including related invoices and estimates
- **ProductForm.tsx**: Form for creating and editing products
- **ProductSummaryCards.tsx**: Displays summary analytics for products

## Hooks

### useProducts.ts

The main hook for managing product data:

```typescript
const {
  // Queries
  products,               // Array of products
  isLoading,              // Loading state
  isError,                // Error state
  error,                  // Error object
  
  // Single product operations
  getProduct,             // Get a single product by ID
  getProductSummary,      // Get product summary statistics
  getProductInvoiceLines, // Get invoice lines for a product
  getProductEstimateLines, // Get estimate lines for a product
  getProductPayments,     // Get vendor payments for a product
  
  // Mutations
  createProduct,          // Create a new product
  updateProduct,          // Update an existing product
  deleteProduct,          // Delete a product
  
  // Mutation states
  isCreating,             // Creating state
  isUpdating,             // Updating state
  isDeleting              // Deleting state
} = useProducts(filters);
```

#### Parameters

- `filters`: Optional `ProductFilters` object to filter the products

#### Filter Options

```typescript
interface ProductFilters {
  category?: string;           // Filter by category
  vendorId?: string;           // Filter by vendor (rowid_accounts)
  purchaseOrderId?: string;    // Filter by purchase order (rowid_purchase_orders)
  search?: string;             // Search term for product name or description
  onlySamples?: boolean;       // Show only sample products
  onlyFronted?: boolean;       // Show only fronted products
  onlyMiscellaneous?: boolean; // Show only miscellaneous items
  dateFrom?: Date;             // Filter by purchase date (from)
  dateTo?: Date;               // Filter by purchase date (to)
}
```

## Usage Examples

### Fetching Products

```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductsList() {
  const { products, isLoading } = useProducts({
    category: 'Electronics',
    onlySamples: true
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.display_name}</div>
      ))}
    </div>
  );
}
```

### Creating a Product

```typescript
import { useProducts } from '@/hooks/useProducts';

function CreateProductForm() {
  const { createProduct, isCreating } = useProducts();
  
  const handleSubmit = (data) => {
    createProduct({
      vendor_product_name: data.vendorProductName,
      new_product_name: data.newProductName,
      category: data.category,
      cost: data.cost,
      total_qty_purchased: data.quantity,
      rowid_accounts: data.vendorId,
      rowid_purchase_orders: data.purchaseOrderId,
      samples: data.isSample,
      fronted: data.isFronted,
      product_purchase_date: data.purchaseDate
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

### Displaying Product Details

```typescript
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';

function ProductDetail({ productId }) {
  const { getProduct, getProductInvoiceLines } = useProducts();
  const [product, setProduct] = useState(null);
  const [invoiceLines, setInvoiceLines] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const productData = await getProduct(productId);
      setProduct(productData);
      
      const invoiceLineData = await getProductInvoiceLines(productData.glide_row_id);
      setInvoiceLines(invoiceLineData);
    };
    
    fetchData();
  }, [productId]);
  
  if (!product) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>{product.display_name}</h2>
      <p>Category: {product.category}</p>
      <p>Cost: ${product.cost}</p>
      <p>Quantity: {product.total_qty_purchased}</p>
      
      <h3>Invoice Lines</h3>
      {invoiceLines.map(line => (
        <div key={line.id}>
          Invoice: {line.gl_invoices?.invoice_number} - Quantity: {line.quantity}
        </div>
      ))}
    </div>
  );
}
```

## Implementation Notes

1. The Products module uses TanStack Query for data fetching and caching
2. All database operations follow the Glidebase pattern for relationships
3. The UI components use Tailwind CSS for styling and Tremor for charts and data visualization
4. The module integrates with other parts of the system, such as invoices, estimates, and purchase orders
5. Special product types (samples, fronted, miscellaneous) have dedicated flags and UI treatments

## Database Views

The module uses a materialized view `mv_product_vendor_details` that joins products with their vendor information for efficient querying:

```sql
CREATE MATERIALIZED VIEW mv_product_vendor_details AS
SELECT 
  p.*,
  a.account_name as vendor_name
FROM 
  gl_products p
LEFT JOIN 
  gl_accounts a ON p.rowid_accounts = a.glide_row_id;
```

This view is refreshed when needed using:

```sql
REFRESH MATERIALIZED VIEW mv_product_vendor_details;
```

## Database Functions and Triggers

### set_default_product_category

A database trigger function that ensures the `category` field in the `gl_products` table is never NULL by setting a default value of "Flowers".

```sql
CREATE OR REPLACE FUNCTION public.set_default_product_category()
RETURNS TRIGGER AS $$
BEGIN
  -- If category is NULL, set it to 'Flowers'
  IF NEW.category IS NULL THEN
    NEW.category := 'Flowers';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function
CREATE TRIGGER set_product_category_trigger
BEFORE INSERT OR UPDATE ON public.gl_products
FOR EACH ROW
EXECUTE FUNCTION public.set_default_product_category();
```

**Purpose:** Maintains data consistency by ensuring all products have a category, which improves reporting and filtering capabilities.

**Behavior:** Runs automatically before any INSERT or UPDATE operation on the `gl_products` table. If the category field is NULL, it sets it to "Flowers".

**Implementation Details:** Uses a BEFORE trigger to modify the NEW record before it's written to the database. No frontend code changes are required as the default value is handled entirely at the database level.

[See detailed documentation](../database/set_default_product_category.ts)
