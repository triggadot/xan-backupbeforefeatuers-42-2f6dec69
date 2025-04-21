
# Comprehensive Documentation: Business Logic Flow and Data Relationships

## 1. Account Relationships and Balance Calculation

### Current Implementation:
- Accounts can be of type Vendor, Customer, or Both
- Account relationships are tracked via foreign keys:
  - Products → Accounts (vendor relationship via `rowid_accounts`)
  - Invoices → Accounts (customer relationship via `rowid_accounts`)
  - Purchase Orders → Accounts (vendor relationship via `rowid_accounts`)
  - Estimates → Accounts (customer relationship via `rowid_accounts`)
  - Shipping Records → Up to 3 Accounts (multi-customer shipping)
- Functions `is_customer()` and `is_vendor()` validate account types

### Account Balance Logic:
- **Customer Balance**: Sum of unpaid invoice amounts and sample estimates
  - Calculated as `total_invoice_amount - total_payments_received`
  - **Positive balance means customer owes money to us**
- **Vendor Balance**: Sum of unpaid purchase order amounts plus sample/fronted product costs
  - Calculated as `(total_purchase_amount - total_payments_made) + (sample_product_value + fronted_product_value)`
  - **Negative balance means we owe vendor money**

### Balance Calculation Logic:
The database now includes comprehensive balance calculations via the following functions:

```sql
-- Main function to calculate account balance
CREATE OR REPLACE FUNCTION gl_calculate_account_balance(account_id uuid)
RETURNS numeric AS $$
```

This function calculates:
1. Customer balances (positive) from unpaid invoices and sample estimates 
2. Vendor balances (negative) from unpaid purchase orders and sample/fronted products
3. Returns a total balance where:
   - Positive balance = They owe us money
   - Negative balance = We owe them money

The function includes triggers on all relevant tables to maintain up-to-date balances:
- gl_invoices
- gl_customer_payments
- gl_purchase_orders
- gl_vendor_payments
- gl_products (for sample/fronted products)
- gl_estimates (for sample estimates)
- gl_customer_credits

## 2. Product Inventory Tracking

### Current Implementation:
- Products track original purchase quantity via `total_qty_purchased`
- Products are linked to Purchase Orders via `rowid_purchase_orders`
- Products are displayed via materialized view `mv_product_vendor_details`
- Display name is set via `handle_po_product_changes()` function and trigger
- Inventory levels now calculated via `gl_calculate_product_inventory()` function

### Implemented Logic:
- Current Inventory = Original Purchase Quantity - Sold Quantity - Sample Quantity
- Sold Quantity = Sum of quantities from invoice lines
- Sample Quantity = Sum of quantities from sample-marked estimate lines
- Special tracking for sample and fronted products via `payment_status` field in materialized view
- Unpaid inventory view `gl_unpaid_inventory` provides quick access to samples and fronted products
- Function `gl_update_product_payment_status()` allows changing product status (pay for or return samples)

### Database Objects Created:
- Function `gl_calculate_product_inventory()` - Calculates current inventory levels
- Enhanced materialized view `mv_product_vendor_details` with inventory calculations
- View `gl_unpaid_inventory` for tracking unpaid inventory (samples and fronted products)
- Function `gl_update_product_payment_status()` for handling payments or returns
- Indexes on relevant foreign key columns for better performance

### Sample Product and Fronted Product Logic:
- **Sample Products**: Products marked with `samples = true`
  - Value calculated as `cost * total_units_behind_sample` (or `cost * total_qty_purchased` if no units specified)
  - Affects vendor balance (vendor is owed for these products)
  - Can be paid for or returned to vendor
  
- **Fronted Products**: Products marked with `fronted = true`
  - Value calculated as `cost * total_qty_purchased`
  - Special terms may be specified in `terms_for_fronted_product`
  - Can be paid for according to fronted terms

## 3. Invoice and Payment Processing

### Current Implementation:
- Invoice totals are calculated from invoice lines via `update_invoice_totals()` function
- Line totals are calculated via `handle_invoice_line_changes()` function
- Customer payments are linked to invoices via `rowid_invoices`
- Payment handling uses `handle_customer_payment_changes()` function
- Invoice balance = total_amount - total_paid
- Invoice status is determined by payment status
- Materialized view `mv_invoice_customer_details` reflects customer details
- UID generation via `generate_invoice_uid_trigger()` function

### Payment Status Logic:
- Draft: total_amount = 0
- Paid: balance <= 0
- Partial: balance > 0 AND total_paid > 0
- Overdue: balance > 0 AND due date past
- Unpaid: Otherwise

### Existing Triggers:
- `handle_invoice_line_changes` - Calculates line totals and updates invoice totals
- `invoice_lines_total_update` - Updates invoice timestamps when lines change
- `handle_customer_payment_changes` - Updates invoice totals when payments change
- `generate_invoice_uid` - Generates unique invoice ID

### What Works:
- The trigger functions for invoice line changes and payment changes
- The automatic calculation of invoice totals and balances
- Correct status determination
- Materialized view refresh on changes

## 4. Estimate and Credit Processing

### Current Implementation:
- Estimate totals are calculated from estimate lines via `update_estimate_totals()` function
- Estimate line totals via `handle_estimate_line_changes()` function
- Customer credits linked via `rowid_estimates`
- Credit handling via `handle_customer_credit_changes()` function
- Estimate balance = total_amount - total_credits
- Materialized view `mv_estimate_customer_details` reflects customer details
- Estimate status logic is based on conversion status and amounts

### Status Logic:
- Converted: valid_final_create_invoice_clicked = true
- Draft: total_amount = 0
- Pending: Otherwise

### Existing Triggers:
- `handle_estimate_line_changes` - Calculates line totals and updates estimate totals
- `estimate_lines_total_update` - Updates estimate timestamps when lines change
- `handle_customer_credit_changes` - Updates estimate totals when credits change

### Required Enhancements:
- Update estimate lines to properly reference products using `rowid_products`
- Create inventory impact logic for estimates marked as samples
- Add conversion logic to transfer estimate lines to invoice lines

```sql
-- Function to convert estimate to invoice
CREATE OR REPLACE FUNCTION convert_estimate_to_invoice(estimate_id text)
RETURNS text AS $$
DECLARE
    v_estimate RECORD;
    v_new_invoice_id text;
BEGIN
    -- Get estimate details
    SELECT * INTO v_estimate
    FROM gl_estimates
    WHERE glide_row_id = estimate_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estimate not found';
    END IF;
    
    -- Create new invoice
    INSERT INTO gl_invoices (
        rowid_accounts,
        invoice_order_date,
        notes
    ) VALUES (
        v_estimate.rowid_accounts,
        CURRENT_TIMESTAMP,
        'Converted from Estimate ' || estimate_id
    ) RETURNING glide_row_id INTO v_new_invoice_id;
    
    -- Copy estimate lines to invoice lines
    INSERT INTO gl_invoice_lines (
        rowid_invoices,
        renamed_product_name,
        qty_sold,
        selling_price,
        product_sale_note,
        rowid_products,
        date_of_sale
    )
    SELECT 
        v_new_invoice_id,
        sale_product_name,
        qty_sold,
        selling_price,
        product_sale_note,
        rowid_products,
        date_of_sale
    FROM gl_estimate_lines
    WHERE rowid_estimates = estimate_id;
    
    -- Mark estimate as converted
    UPDATE gl_estimates
    SET 
        valid_final_create_invoice_clicked = true,
        rowid_invoices = v_new_invoice_id,
        status = 'converted',
        updated_at = CURRENT_TIMESTAMP
    WHERE glide_row_id = estimate_id;
    
    RETURN v_new_invoice_id;
END;
$$ LANGUAGE plpgsql;
```

## 5. Purchase Order Processing

### Current Implementation:
- Purchase Order totals are calculated from linked products via `update_po_totals()` function
- Products are linked to POs via `rowid_purchase_orders`
- Vendor payments linked via `rowid_purchase_orders`
- Payment handling via `handle_vendor_payment_changes()` function
- PO balance = total_amount - total_paid
- Status is determined based on payment status
- Materialized view `mv_purchase_order_vendor_details` reflects vendor details
- PO UID generation via `generate_po_uid_trigger()` function

### Status Logic:
- Draft: total_amount = 0
- Complete: balance <= 0
- Partial: balance > 0 AND total_paid > 0
- Received: Otherwise

### Existing Triggers:
- `handle_po_product_changes` - Updates product display name and PO totals
- `handle_vendor_payment_changes` - Updates PO totals when payments change
- `generate_po_uid` - Generates unique PO ID

### Frontend Implementation:
- Purchase orders are managed through a dedicated set of components and hooks
- Main components:
  - `PurchaseOrders.tsx` - Lists all purchase orders with filtering capability 
  - `PurchaseOrderDetail.tsx` - Shows detailed view of a single purchase order
  - `PurchaseOrderCard.tsx` - Card component for displaying purchase order summary
- Data flow is managed through these hooks:
  - `usePurchaseOrders.ts` - Main hook that combines all purchase order functionalities
  - `useFetchPurchaseOrders.ts` - Fetches and filters purchase orders
  - `usePurchaseOrderDetail.ts` - Fetches detailed purchase order data
  - `usePurchaseOrderMutation.ts` - Creates and updates purchase orders

### Type Definitions:
- The system uses TypeScript interfaces for type safety:
  - `PurchaseOrder` - Core interface for detailed purchase order data
  - `PurchaseOrderWithVendor` - Interface for purchase order listings
  - `PurchaseOrderLineItem` - Interface for products in a purchase order
  - `VendorPayment` - Interface for payments against purchase orders

### Recent Type Safety and Null Handling Improvements:
- Enhanced null checks throughout purchase order components and hooks
- Default values provided for all nullable fields to prevent runtime errors
- Consistent type casting for status and other enumerated fields
- Improved error handling with specific error messages
- Added defensive programming approaches to handle empty arrays and optional fields
- Updated interface definitions to accurately reflect database schema

## 6. Materialized Views and Data Relationships

### Current Implementation:
The following materialized views exist:
- `mv_account_details` - Account information with balances
- `mv_product_vendor_details` - Products with vendor information (enhanced with inventory data)
- `mv_purchase_order_vendor_details` - Purchase orders with vendor details
- `mv_invoice_customer_details` - Invoices with customer information
- `mv_estimate_customer_details` - Estimates with customer information

### Refresh Triggers:
- `refresh_account_views_trigger` - Refreshes account views on changes
- `refresh_product_views_trigger` - Refreshes product views on changes
- `refresh_po_views_trigger` - Refreshes PO views on changes
- `refresh_invoice_views_trigger` - Refreshes invoice views on changes
- `refresh_estimate_views_trigger` - Refreshes estimate views on changes

### Implemented Enhancements:
- Enhanced `mv_product_vendor_details` with inventory calculations:
  - current_inventory - Current inventory level
  - total_sold - Total quantity sold through invoices
  - total_sampled - Total quantity given as samples
  - sample_value - Calculated value of sample products
  - fronted_value - Calculated value of fronted products
  - payment_status - Status indicator for product payment (Sample/Fronted/Paid)
  - inventory_value - Calculated value of current inventory

- New view `gl_unpaid_inventory` for easy access to sample and fronted products

## 7. Business Operations and Metrics

### Current Implementation:
- Metrics are calculated using database functions:
  - `gl_get_business_stats()` - Overall business metrics
  - `gl_get_invoice_metrics()` - Invoice-specific metrics
  - `gl_get_purchase_order_metrics()` - Purchase order metrics
  - `gl_get_account_stats()` - Account-related stats
  - `gl_get_document_status()` - Document status breakdown
- Data is gathered in `gl_business_metrics` and `gl_current_status` tables

### Required Enhancements:
- Include sample product logic in metrics calculations
- Update metrics to reflect accurate inventory levels
- Add functionality to track product sales trends
- Implement profit calculation on invoice items

## 8. Index Management

### Current Implementation:
For optimal query performance, indexes have been created on frequently queried columns:

### Implemented Indexes:
- `gl_products`: `rowid_accounts`, `rowid_purchase_orders`
- `gl_invoice_lines`: `rowid_products`
- `gl_estimate_lines`: `rowid_products`
- All tables: `glide_row_id` (already exists as primary key or unique constraint in most cases)

## 9. Implementation Plan

### Phase 1: Database Schema and Function Updates (Completed)
1. ✅ Update account balance calculation to include sample products
2. ✅ Create product inventory calculation function
3. ✅ Enhance materialized views with calculated fields
4. ✅ Create required indexes for foreign key relationships
5. ✅ Implement account balance calculation based on all relationships

### Phase 2: Business Logic Implementation (In Progress)
1. ⏳ Implement conversion of estimates to invoices
2. ✅ Update product inventory tracking logic
3. ✅ Enhance account balance calculations in the frontend
4. ⏳ Create shipping record integration with invoices
5. ✅ Improve type safety and null handling in purchase order components

### Phase 3: Frontend Integration (In Progress)
1. ⏳ Update dashboard to show new metrics
2. ⏳ Add inventory indicators to product listing
3. ✅ Show account balances with appropriate positive/negative indicators
4. ⏳ Create interface for estimate to invoice conversion
5. ✅ Create unpaid inventory management interface
6. ✅ Enhance purchase order components with better error handling and type safety

### Phase 4: Testing and Validation
1. ⏳ Test inventory deduction on invoice creation
2. ⏳ Validate sample product impact on vendor balances
3. ⏳ Ensure account balance calculations are accurate
4. ⏳ Test data consistency across materialized views
5. ✅ Test purchase order components with different data scenarios

## 10. Conclusion and Next Steps

The current implementation handles comprehensive calculations for invoices, estimates, purchase orders, and account balances. We have implemented:

1. ✅ Comprehensive inventory tracking including sample and fronted products 
2. ✅ Account balance calculations that reflect the business relationships correctly:
   - Positive balances: money owed to us
   - Negative balances: money we owe to others
3. ✅ Automatic balance updates via triggers when related records change
4. ✅ Type-safe frontend components with improved null handling and error management

The next critical steps are:
1. Implement the estimate to invoice conversion function
2. Create frontend interfaces to better visualize account balances and financial relationships
3. Enhance dashboard metrics to reflect accurate inventory and financial data
4. Implement additional reporting features

## 11. Sample and Fronted Product Management

### Implementation Details:
- Sample products are marked with `samples = true` in the `gl_products` table
- Fronted products are marked with `fronted = true` in the `gl_products` table
- The value of sample products is calculated as `cost * total_units_behind_sample`
- The value of fronted products is calculated as `cost * total_qty_purchased`
- The `gl_unpaid_inventory` view provides easy access to all unpaid inventory
- The `gl_update_product_payment_status()` function allows changing product status:
  - Pay for samples/fronted products by setting status to 'Paid'
  - Return samples to vendor by setting status to 'Returned'

### Business Impact:
- Sample and fronted products affect vendor balance calculations
- Inventory calculations take into account samples given out
- The unpaid inventory management interface allows tracking and resolving unpaid product statuses
- Account balances now provide a true representation of financial obligations

## 12. Recent Frontend Improvements

### Type Safety and Error Handling:
- Enhanced null checking in purchase order components and hooks
- Default values for all nullable fields to prevent runtime errors
- Consistent type casting for status fields and other enumerations
- Better error messaging and handling throughout the purchase order flow
- Defensive programming to handle edge cases like empty arrays and missing fields
- Updated TypeScript interface definitions to accurately reflect database schema

### User Interface Improvements:
- Improved loading states with appropriate skeleton loaders
- Clear status indicators with proper color coding
- Responsive design for all purchase order components
- Better organization of purchase order information with tabs and cards
- Enhanced table displays for better readability of line items and payments
- Consistent error messages and toast notifications

### Performance Optimizations:
- Reduced unnecessary re-renders in purchase order components
- Optimized database queries with proper filtering
- Implemented memoization for expensive calculations
- Added proper indexes for commonly queried fields
- Improved data loading patterns for better user experience
