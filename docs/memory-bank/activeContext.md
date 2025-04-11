# Active Context

## Current Focus
- Implementing Supabase-to-Glide synchronization using n8n as an intermediary
- Reorganizing hooks into feature-based directories following the Feature-Based Architecture pattern
- Improving product inventory management system with comprehensive views
- Enhancing PDF generation system for all document types
- Consolidating duplicate code and implementing consistent patterns
- Creating documentation for new database functions

## Recent Changes
1. Revised calculation logic for `gl_accounts` balances:
   - vendor_balance: Now calculated as sum of related gl_purchase_orders.balance * -1
   - balance: Calculated as customer_balance + vendor_balance
   - Implemented via database triggers for automatic updates
   - Removed the old `gl_calculate_account_balance` function
   - Added backfill functions for existing data

2. Reorganized purchase order hooks following Feature-Based Architecture:
   - Primary hooks: usePurchaseOrders, usePurchaseOrderDetail
   - Legacy hooks maintained with backward compatibility exports

3. Added Product Category Default Logic:
   - New database function: `set_default_product_category()`
   - Trigger: `set_product_category_trigger`
   - Default value: "Flowers" for NULL category fields

4. Removed legacy pages and moving toward a unified UI approach:
   - Deprecated old pages in src/pages root
   - New pages in src/pages/new to be moved to root once fully tested

## Ongoing Tasks
- Implementing Supabase-to-Glide synchronization system:
  - ✅ Products synchronization completed
  - 🔄 Invoices synchronization in progress
  - Infrastructure tables partially set up
  - Need to create gl_id_mappings and gl_webhook_config tables
  - Developing n8n workflows for entity-specific operations
  - Creating edge function for webhook processing

- Creating a comprehensive product inventory management system showing:
  - Basic product information
  - Related invoice data
  - Related purchase order data
  - Related estimate data
  - Vendor information
  - Customer information

- Refactoring PDF generation system by document type:
  - Create document-specific PDF modules
  - Integrate with existing data fetching hooks
  - Update storage and utility functions
  - Create consistent error handling

- Reorganizing hooks into feature directories:
  - Move hooks to appropriate feature directories
  - Create index.ts files with backward compatibility
  - Update import paths in components
  - Remove or deprecate duplicate implementations

- Enhancing UI/UX with Tailwind CSS, Preline UI, and Tremor:
  - Implement improved list views 
  - Create dashboard visualizations
  - Enhance PDF sharing and downloading
  - Improve overall user experience

## Technical Considerations
- Following Glidebase relationship pattern without foreign key constraints
- Implementing bidirectional synchronization between Supabase and Glide
- Using n8n as workflow orchestration for Supabase-to-Glide sync
- Maintaining proper balance calculations across all financial entities

### Payment Implementation Status
- **Current Implementation**:
  - Basic UI components exist: `InvoicePaymentForm` and `InvoicePaymentHistory`
  - Payment CRUD operations functional via `useInvoicePayments` hook
  - Payment status visualization (paid, partially paid, unpaid) implemented
  - Client-side balance calculations working
- **Gaps to Address**:
  - No automatic balance recalculation at database level
  - Missing integration with accounting ledgers
  - Incomplete bidirectional sync for payments via n8n
  - Missing comprehensive financial reconciliation system

### Expense Management Status
- **Current Implementation**:
  - Basic expense viewing and CRUD operations implemented
  - Expense form and detail components functional
  - Basic filtering and categorization in the expense listing
- **Gaps to Address**:
  - No integration between expenses and financial reporting
  - Missing connection between expenses and vendor payments
  - No expense approval workflow
  - Expenses need to be included in bidirectional sync architecture

### Product Management Status
- **Current Implementation**:
  - Basic product list and detail components exist
  - Rudimentary inventory visualization in `ProductInventoryReport`
  - Filtering and categorization implemented
- **Gaps to Address**:
  - Incomplete inventory tracking system
  - Missing integration between invoices/POs and inventory levels
  - No automated inventory adjustments when products are sold/purchased
  - Lack of real inventory analytics and reporting

- Ensuring proper PDF generation for all document types
- Preserving backward compatibility during code reorganization
- Creating detailed documentation for new database functions
