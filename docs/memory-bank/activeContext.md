# Active Context

## Current Focus
- Standardizing file naming conventions (converting PascalCase to kebab-case)
- Implementing TanStack Query for all data fetching and mutations
- Migrating to the service layer pattern for Supabase table access
- Enhancing PDF generation and management functionality
- Improving documentation with consistent JSDoc comments and markdown files

## Recent Changes
1. **Consolidated Documentation Approach**:
   - Created single source of truth in `/docs` directory
   - Standardized documentation format across the project
   - Removed legacy README files in favor of centralized documentation
   - Enhanced main README with development standards

2. **Migrated Hooks to TanStack Query**:
   - Updated useInvoices to use TanStack Query with proper caching
   - Implemented useInvoiceMutation with optimistic updates
   - Converted useInvoicePayments to use mutations
   - Added service layer integration to hooks

3. **Enhanced PDF Management**:
   - Added PDF Failures Manager component to the admin section
   - Implemented centralized PDF management interface
   - Created consistent error handling for PDF generation failures
   - Improved PDF storage and retrieval mechanisms

4. **Standardized Naming Conventions**:
   - Defined clear conventions for files, components, and variables
   - Converted invoice components to kebab-case files
   - Created barrel exports for clean imports
   - Documented migration plan for remaining components

5. **Implemented Service Layer**:
   - Created typed service modules for Supabase tables
   - Implemented consistent method naming conventions
   - Added proper error handling and logging
   - Updated hooks to use the service layer

## Ongoing Tasks
- **File Naming Standardization**:
  - Converting PurchaseOrderList.tsx to purchase-order-list.tsx
  - Updating imports to use barrel files
  - Maintaining backward compatibility during transition
  - Focusing on purchase order components first

- **TanStack Query Migration**:
  - Converting remaining hooks to use TanStack Query
  - Implementing proper query invalidation for related data
  - Adding optimistic updates for better UX
  - Creating consistent error handling patterns

- **Service Layer Implementation**:
  - Creating remaining service modules for all tables
  - Adding comprehensive error handling
  - Implementing consistent method patterns
  - Updating hooks to use services for data access

- **Documentation Improvements**:
  - Adding JSDoc comments to all key components
  - Updating type definitions with better documentation
  - Creating usage examples for complex components
  - Standardizing documentation format

- **Component Structure Refinement**:
  - Moving components to feature-based directories
  - Implementing consistent prop interfaces
  - Adding proper TypeScript typing to all components
  - Creating reusable UI patterns

## Technical Considerations
- **TanStack Query Patterns**:
  - Consistent queryKey structure (e.g., ['invoices', filters])
  - Proper cache invalidation on mutations
  - Error handling and loading states
  - Optimistic updates for better user experience

- **Service Layer Implementation**:
  - Type-safe return values
  - Consistent error handling
  - Method naming conventions
  - Proper use of Supabase query builder

- **File Naming Migration**:
  - Maintain backward compatibility during transition
  - Update imports across the codebase
  - Use barrel files for clean exports
  - Migrate one feature at a time

- **PDF System Improvements**:
  - Centralized error handling
  - Failure tracking and management
  - Consistent template structure
  - PDF storage and retrieval optimization

- **Component Structure**:
  - Feature-based organization
  - Consistent prop interfaces
  - Reusable UI patterns
  - Clear separation of concerns

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
