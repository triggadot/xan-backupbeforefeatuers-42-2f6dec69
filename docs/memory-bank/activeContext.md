# Active Context

## Current Focus
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
- Maintaining proper balance calculations across all financial entities
- Ensuring proper PDF generation for all document types
- Preserving backward compatibility during code reorganization
- Creating detailed documentation for new database functions
