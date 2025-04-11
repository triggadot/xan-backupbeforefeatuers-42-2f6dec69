# System Patterns

## Architecture Overview
The project follows a Feature-Based Architecture (Domain-Driven Design with feature modules), organizing code by domain rather than technical role.

### Directory Structure
```
src/
├── components/
│   ├── products/                  # Product-specific components
│   │   ├── ProductList.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ProductForm.tsx
│   │   └── product-analytics.tsx
│   ├── invoices/                  # Invoice-specific components
│   ├── purchase-orders/           # Purchase order components
│   └── shared/                    # Shared components
├── hooks/
│   ├── products/                  # Product-specific hooks
│   │   ├── useProducts.ts         # Main hook for fetching products
│   │   ├── useProductDetail.ts    # Hook for fetching detailed product info
│   │   ├── useProductVendors.ts   # Hook for product-vendor relationships
│   │   └── index.ts               # Exports all hooks with backward compatibility
│   ├── invoices/                  # Invoice-specific hooks
│   ├── purchase-orders/           # Purchase order hooks
│   └── shared/                    # Shared hooks
├── pages/
│   ├── Products.tsx               # Main products page
│   ├── ProductDetail.tsx          # Product detail page
│   ├── Invoices.tsx               # Main invoices page
│   └── ...                        # Other pages
└── types/
    ├── products/                  # Product-specific types
    ├── invoices/                  # Invoice-specific types
    └── ...                        # Other type modules
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

3. **Payment Relationship Architecture** (Partially Implemented):
   - Three primary payment tables with common pattern but entity-specific implementations:
     - `gl_customer_payments`: For invoice payments from customers
     - `gl_vendor_payments`: For purchase order payments to vendors
     - `gl_customer_credits`: For estimate credits to customers
   - Common fields across payment tables:
     - `id`: UUID primary key
     - `glide_row_id`: Unique string identifier for Glide synchronization
     - `payment_amount`: Numeric field for payment value
     - `date_of_payment`: Timestamp for payment date
     - `rowid_accounts`: Reference to customer/vendor account
   - Parent document references:
     - `gl_customer_payments.rowid_invoices`: Links payment to invoice
     - `gl_vendor_payments.rowid_purchase_orders`: Links payment to purchase order
     - `gl_customer_credits.rowid_estimates`: Links credit to estimate
   - Current Status:
     - ✅ Basic UI components for payment entry exist
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
