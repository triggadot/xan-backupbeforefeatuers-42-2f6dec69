# System Patterns

## Architecture Overview
The project follows a Feature-Based Architecture, organizing code by domain/feature rather than technical role. This approach provides better cohesion, isolation, and maintainability.

### Directory Structure
```
src/
├── components/
│   ├── new/                       # New components following conventions
│   │   ├── invoices/              # Invoice-specific components with kebab-case files
│   │   │   ├── invoice-list.tsx
│   │   │   ├── invoice-detail-view.tsx
│   │   │   └── index.ts           # Barrel export file
│   │   ├── purchase-orders/       # Purchase order components
│   │   │   ├── PurchaseOrderList.tsx  # In process of migration to kebab-case
│   │   │   └── index.ts
│   ├── ui/                        # UI primitives (Shadcn)
│   ├── tremor/                    # Data visualization components
│   └── custom/                    # Custom reusable components
├── hooks/
│   ├── invoices/                  # Invoice-specific hooks
│   │   ├── useInvoices.ts         # TanStack Query implementation
│   │   ├── useInvoiceMutation.ts  # CRUD operations with mutations
│   │   └── index.ts               # Barrel exports with backward compatibility
│   ├── purchase-orders/           # Purchase order hooks
│   ├── products/                  # Product hooks
│   └── utils/                     # Utility hooks
├── services/
│   └── supabase/                  # Supabase service layer
│       ├── gl-invoices.ts         # Invoice service
│       ├── gl-purchase-orders.ts  # Purchase orders service
│       └── tables.ts              # Service exports
├── types/
│   ├── new/                       # New type definitions
│   │   ├── invoice.ts
│   │   ├── purchase-order.ts
│   │   └── legacy/                    # Legacy types for compatibility
├── lib/
│   ├── pdf/                       # PDF generation modules
│   └── utils.ts                   # Utility functions
└── pages/
    ├── invoices/                  # Invoice pages
    ├── purchase-orders/           # Purchase order pages
    └── admin/                     # Admin pages
```

## Key Implementation Patterns

### 1. Supabase Service Layer Pattern
The service layer provides a consistent interface to Supabase tables with proper typing:

```typescript
// src/services/supabase/gl-invoices.ts
import { supabase } from '@/integrations/supabase/client';
import { GLInvoice, GLInvoiceForm } from '@/types/new/invoice';

export const glInvoicesService = {
  // Get multiple invoices with optional filters
  async getInvoices(options?: { accountId?: string; status?: string }) {
    const query = supabase.from('gl_invoices').select('*');
    
    if (options?.accountId) {
      query.eq('rowid_accounts', options.accountId);
    }
    
    if (options?.status) {
      query.eq('payment_status', options.status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    return data as GLInvoice[];
  },
  
  // Get a single invoice by ID
  async getInvoice(id: string) {
    const { data, error } = await supabase
      .from('gl_invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
    
    return data as GLInvoice;
  },
  
  // Create a new invoice
  async createInvoice(invoice: GLInvoiceForm) {
    const { data, error } = await supabase
      .from('gl_invoices')
      .insert(invoice)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
    
    return data as GLInvoice;
  },
  
  // Update an existing invoice
  async updateInvoice(id: string, updates: Partial<GLInvoiceForm>) {
    const { data, error } = await supabase
      .from('gl_invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating invoice ${id}:`, error);
      throw error;
    }
    
    return data as GLInvoice;
  },
  
  // Delete an invoice
  async deleteInvoice(id: string) {
    const { error } = await supabase
      .from('gl_invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }
  }
};
```

### 2. TanStack Query Hook Pattern
All data fetching hooks use TanStack Query for consistent caching, state management, and mutations:

```typescript
// src/hooks/invoices/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { glInvoicesService } from '@/services/supabase/gl-invoices';
import { Invoice, InvoiceFilters } from '@/types/new/invoice';
import { normalizeInvoiceFields } from '@/types/new/invoice';

export function useInvoices(filters?: InvoiceFilters) {
  const queryClient = useQueryClient();

  // Query for fetching invoices
  const {
    data: invoices = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const data = await glInvoicesService.getInvoices(filters);
      return data.map(invoice => normalizeInvoiceFields(invoice));
    }
  });

  // Mutation for creating invoice
  const createInvoice = useMutation({
    mutationFn: glInvoicesService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  // Mutation for updating invoice
  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) => 
      glInvoicesService.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  // Mutation for deleting invoice
  const deleteInvoice = useMutation({
    mutationFn: glInvoicesService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  return {
    invoices,
    isLoading,
    error,
    refetch,
    createInvoice,
    updateInvoice,
    deleteInvoice
  };
}
```

### 3. Component Export Pattern
All components use barrel exports through index.ts files for cleaner imports:

```typescript
// src/components/new/invoices/index.ts
export { InvoiceList } from './invoice-list';
export { InvoiceDetailView } from './invoice-detail-view';
export { InvoiceStats } from './invoice-stats';
```

Usage:
```typescript
// Importing components
import { InvoiceList, InvoiceStats } from '@/components/new/invoices';
```

### 4. Naming Convention Pattern
- **Files & Directories**: kebab-case (e.g., `invoice-list.tsx`, `purchase-orders/`)
- **Components**: PascalCase (e.g., `InvoiceList`, `PurchaseOrderDetail`)
- **Hooks**: camelCase prefixed with "use" (e.g., `useInvoices`, `usePurchaseOrderDetail`)
- **Services**: camelCase with prefix (e.g., `glInvoicesService`, `glProductsService`)
- **Types**: PascalCase (e.g., `Invoice`, `PurchaseOrder`, `InvoiceLineItem`)

### 5. Database Relationship Pattern
All relationships use the "Glidebase" pattern with `rowid_` fields:

- Foreign key fields use prefix `rowid_` followed by plural name of referenced table
- These fields reference the `glide_row_id` field (not UUID primary key)
- No actual foreign key constraints in database
- Examples:
  - `gl_invoice_lines.rowid_invoices` → `gl_invoices.glide_row_id`
  - `gl_products.rowid_purchase_orders` → `gl_purchase_orders.glide_row_id`

### 6. Manual Join Pattern
Due to lack of foreign key constraints, relationships are manually joined:

```typescript
// 1. Fetch primary entities
const { data: invoices } = await supabase.from('gl_invoices').select('*');

// 2. Fetch related data
const { data: accounts } = await supabase.from('gl_accounts').select('*');

// 3. Create lookup map
const accountMap = new Map();
accounts.forEach(account => {
  accountMap.set(account.glide_row_id, account);
});

// 4. Join the data
const invoicesWithAccounts = invoices.map(invoice => {
  return {
    ...invoice,
    account: invoice.rowid_accounts ? accountMap.get(invoice.rowid_accounts) : null
  };
});
```

### 7. PDF System Architecture
PDF generation is handled through a combination of client and server components:

- **Client-side Generation**: 
  - Uses jsPDF for most documents
  - Stores PDFs in Supabase Storage
  - Updates database with PDF URL

- **PDF Admin Components**:
  - PDF Management Page - Central interface for PDF operations
  - PDF Failures Manager - Tracks and handles PDF generation errors

- **Document Types**:
  - Invoices
  - Purchase Orders
  - Estimates
  - Product Catalogs
  - Shipping Documents

### 8. Error Handling Pattern
Consistent error handling across the application:

```typescript
try {
  // Operation that might fail
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log specific error with context
  console.error('Error in specific context:', error);
  
  // Application-specific error handling
  if (error.code === 'POSTGRES_ERROR') {
    // Handle database error
  } else if (error.code === 'STORAGE_ERROR') {
    // Handle storage error
  }
  
  // User feedback via toast notifications
  toast({
    title: 'Operation Failed',
    description: 'Specific error message for user',
    variant: 'destructive',
  });
  
  // Rethrow for caller to handle or use fallback
  throw error;
}
```

## Database Patterns
1. **Glidebase Relationship Pattern**:
   - All foreign key relationships use `glide_row_id` (string/text) fields
   - Foreign key fields use the prefix `rowid_` followed by the plural name of the referenced table
   - These fields reference the `glide_row_id` field in the target table
   - Examples:
     - `gl_estimate_lines.rowid_estimates` → references `gl_estimates.glide_row_id`
     - `gl_invoice_lines.rowid_invoices` → references `gl_invoices.glide_row_id`
     - `gl_products.rowid_purchase_orders` → references `gl_purchase_orders.glide_row_id`
   - No actual foreign key constraints in the database (deliberate design choice)
   - Relationship integrity maintained through application logic, triggers, and proper indexing

2. **Balance Calculation Pattern**:
   - Account balances calculated as `customer_balance + vendor_balance`
   - Customer balance includes outstanding invoice balances and sample estimate balances
   - Vendor balance calculated as `(Sum of related gl_purchase_orders.balance * -1)`
   - Balances updated via database triggers when related records change

3. **Payment Relationship Architecture**

The system manages financial relationships through a set of interconnected tables and processes:

1. **Core Payment Tables**:
   - `gl_customer_payments`: Records payments from customers against invoices
   - `gl_vendor_payments`: Records payments to vendors against purchase orders
   - `gl_customer_credits`: Records credit notes issued to customers

2. **Payment Processing Workflow**:
   - Create payment against invoice/purchase order
   - Calculate remaining balance
   - Update invoice/purchase order status
   - Generate receipt/confirmation

3. **Implementation Status**: Partially implemented
   - Basic tables and UI components in place
   - Payment CRUD operations functional through `useInvoicePayments` hook
   - Payment form and history UI components implemented
   - Payment status visualization (paid, partially paid, unpaid)
   - Client-side balance calculations working

4. **Implementation Gaps**:
   - No automatic balance recalculation at database level
   - Missing integration with accounting ledgers
   - Incomplete bidirectional sync for payments
   - No comprehensive financial reconciliation
   - Lack of payment reporting and analytics
     - ✅ Payment data structures are defined
     - ✅ Basic CRUD operations for payments implemented
     - ❌ Missing automatic balance recalculation across entities
     - ❌ Incomplete implementation of payment status tracking
     - ❌ Missing financial reconciliation functionality
   - Required Implementation:
     - Invoice balance updates when payments are added/edited/deleted
     - Purchase order balance updates for vendor payments
     - Estimate credits properly affecting customer account balances
     - Comprehensive financial reporting and reconciliation
     - System-wide consistency checks for payment data

4. **Data Fetching Pattern**:
   - Cannot use Supabase's implicit foreign key joins
   - Manually joining data through multi-step process:
     1. Fetch primary data first
     2. Fetch related data in separate queries
     3. Create lookup maps with glide_row_id as keys
     4. Manually match relationships using these maps
   - Example:
     ```typescript
     // 1. Fetch primary data (invoices)
     const { data: invoiceData } = await supabase.from('gl_invoices').select('*');
     
     // 2. Fetch related data (accounts)
     const { data: accountData } = await supabase.from('gl_accounts').select('*');
     
     // 3. Create lookup map for related data
     const accountMap = new Map();
     accountData.forEach((account) => {
       accountMap.set(account.glide_row_id, account);
     });
     
     // 4. Manually join data
     for (const invoice of invoices) {
       if (invoice.rowid_accounts) {
         const account = accountMap.get(invoice.rowid_accounts);
         if (account) {
           invoice.account = account;
         }
       }
     }
     ```

5. **PDF System Architecture**:
   - Document-specific PDF modules:
     - `src/lib/pdf/invoice-pdf.ts`
     - `src/lib/pdf/estimate-pdf.ts`
     - `src/lib/pdf/purchase-order-pdf.ts`
     - `src/lib/pdf/product-pdf.ts`
     - `src/lib/pdf/common.ts` for shared utilities
   - Integration with data fetching hooks for each document type
   - Consistent error handling and storage using Supabase

## React Patterns
1. **Hook Pattern**:
   - Main data fetching hook for entity lists (e.g., `useProducts`)
   - Detail hook for single entity details (e.g., `useProductDetail`)
   - Relationship hooks for specialized relationships (e.g., `useProductVendors`)
   - Index file for easy importing and backward compatibility

2. **Component Documentation Pattern**:
   - Reusable custom components placed in `src/components/custom/`
   - JSDoc comments directly above component definitions
   - Base UI primitives in `src/components/ui/` (Shadcn UI components)

3. **Data Synchronization Pattern**:
   - Master control functions to disable constraints during sync
   - Table-specific sync functions for data processing
   - Cleanup functions to fix inconsistencies and re-enable constraints
   - Comprehensive logging throughout the sync process

## Supabase-Glide Synchronization Architecture

1. **Bidirectional Sync System**:
   - **Glide to Supabase**: Already implemented and working
     - Uses `gl_mappings` table to define field mappings between systems
     - Synchronizes via edge functions interacting with Glide API
   - **Supabase to Glide**: Being implemented using n8n as intermediary
     - Webhook-based trigger system for Supabase events
     - n8n workflows for data transformation and API calls
     - Edge function for webhook processing and logging

2. **Database Infrastructure**:
   - **Core Tables**:
     - `gl_mappings`: Defines relationships between Glide and Supabase tables
     - `gl_connections`: Stores Glide API credentials and settings
     - `gl_sync_logs`: Records sync operations and results
     - `gl_sync_errors`: Stores error information for failed operations
   - **n8n-specific Tables** (being implemented):
     - `gl_id_mappings`: Maps Supabase IDs to Glide Row IDs
     - `gl_webhook_config`: Stores webhook URLs and configurations
     - `gl_rate_limits`: Manages API rate limits to prevent overload

3. **n8n Workflow Structure**:
   - **Webhook Trigger**: Receives payload from Supabase edge function
   - **Entity/Operation Router**: Routes by entity type and operation type
   - **Data Transformation**: Maps fields based on stored configurations
   - **Glide API Interaction**: Sends properly formatted API requests
   - **Response Handling**: Processes results and returns to edge function

4. **Edge Function Architecture**:
   - Webhook configuration management
   - Authentication and security handling
   - Rate limiting and batching
   - Error recovery and logging

5. **Frontend Integration**:
   - `useSyncedCrud` hook for synchronized CRUD operations
   - Status indicators during sync operations
   - Error handling and retry capabilities
   - Admin dashboard for monitoring sync status
