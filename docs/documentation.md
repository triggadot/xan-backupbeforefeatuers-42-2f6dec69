
# Comprehensive Documentation: Business Logic Flow and Data Relationships

## 1. Account Relationships and Balance Calculation

### Current Implementation:
- Accounts can be of type Vendor, Customer, or Both
- Account relationships are tracked via foreign keys:
  - Products → Accounts (vendor relationship via `rowid_accounts`)
  - Invoices → Accounts (customer relationship via `rowid_accounts`)
  - Purchase Orders → Accounts (vendor relationship via `rowid_accounts`)
  - Estimates → Accounts (customer relationship via `rowid_accounts`)

### Account Balance Logic:
- **Customer Balance**: Sum of unpaid invoice amounts
  - Calculated as `total_invoice_amount - total_payments_received`
  - Positive balance means customer owes money
- **Vendor Balance**: Sum of unpaid purchase order amounts plus sample product costs
  - Calculated as `total_purchase_amount - total_payments_made`
  - Negative balance means business owes vendor money
  - Sample products (marked with `samples = true`) affect vendor balance without vendor payments

### Required Implementation:
- Update materialized view to include sample product values in vendor balance calculations
- Create SQL function to calculate proper account balances

```sql
-- Sample SQL to update account balance calculation
CREATE OR REPLACE FUNCTION update_account_balance(account_id uuid)
RETURNS void AS $$
DECLARE
    v_customer_balance numeric := 0;
    v_vendor_balance numeric := 0;
    v_total_balance numeric := 0;
BEGIN
    -- Calculate customer balance (invoices - payments)
    SELECT COALESCE(SUM(i.balance), 0)
    INTO v_customer_balance
    FROM gl_invoices i
    WHERE i.rowid_accounts = (SELECT glide_row_id FROM gl_accounts WHERE id = account_id);
    
    -- Calculate vendor balance (purchase orders - payments + sample products)
    SELECT COALESCE(SUM(po.balance), 0) + 
           COALESCE((SELECT SUM(p.cost * p.total_qty_purchased) 
                     FROM gl_products p 
                     WHERE p.rowid_accounts = (SELECT glide_row_id FROM gl_accounts WHERE id = account_id)
                     AND p.samples = true), 0) * -1 -- Negate sample costs to show as money owed
    INTO v_vendor_balance
    FROM gl_purchase_orders po
    WHERE po.rowid_accounts = (SELECT glide_row_id FROM gl_accounts WHERE id = account_id);
    
    -- Calculate total balance (customer - vendor)
    v_total_balance := v_customer_balance + v_vendor_balance;
    
    -- Update the account
    UPDATE gl_accounts
    SET balance = v_total_balance
    WHERE id = account_id;
END;
$$ LANGUAGE plpgsql;
```

## 2. Product Inventory Tracking

### Current Implementation:
- Products track original purchase quantity via `total_qty_purchased`
- Products are linked to Purchase Orders via `rowid_purchase_orders`
- No direct tracking of current inventory levels in main product table

### Required Logic:
- Current Inventory = Original Purchase Quantity - Sold Quantity - Sample Quantity
- Sold Quantity = Sum of quantities from invoice lines
- Sample Quantity = Sum of quantities from sample-marked estimate lines

### Implementation Plan:
- Add database functions to calculate current inventory levels
- Update materialized view to include calculated inventory fields
- Create triggers to update inventory when invoices/estimates are created/modified

```sql
-- Function to calculate current product inventory
CREATE OR REPLACE FUNCTION calculate_product_inventory(product_id text)
RETURNS numeric AS $$
DECLARE
    v_total_purchased numeric;
    v_total_sold numeric;
    v_total_samples numeric;
    v_current_inventory numeric;
BEGIN
    -- Get total purchased quantity
    SELECT total_qty_purchased INTO v_total_purchased
    FROM gl_products
    WHERE glide_row_id = product_id;
    
    -- Get total sold quantity from invoices
    SELECT COALESCE(SUM(qty_sold), 0)
    INTO v_total_sold
    FROM gl_invoice_lines
    WHERE rowid_products = product_id;
    
    -- Get total sample quantity from estimates marked as samples
    SELECT COALESCE(SUM(el.qty_sold), 0)
    INTO v_total_samples
    FROM gl_estimate_lines el
    JOIN gl_estimates e ON el.rowid_estimate_lines = e.glide_row_id
    WHERE el.rowid_products = product_id
    AND e.is_a_sample = true;
    
    -- Calculate current inventory
    v_current_inventory := v_total_purchased - v_total_sold - v_total_samples;
    
    RETURN v_current_inventory;
END;
$$ LANGUAGE plpgsql;
```

## 3. Invoice and Payment Processing

### Current Implementation:
- Invoice totals are calculated from invoice lines via `update_invoice_totals()` function
- Invoice balance = total_amount - total_paid
- Invoice status is determined by payment status

### Payment Status Logic:
- Draft: total_amount = 0
- Paid: balance <= 0
- Partial: balance > 0 AND total_paid > 0
- Overdue: balance > 0 AND due date past
- Unpaid: Otherwise

### What Works:
- The trigger functions for invoice line changes and payment changes
- The automatic calculation of invoice totals and balances
- Correct status determination

## 4. Estimate and Credit Processing

### Current Implementation:
- Estimate totals are calculated from estimate lines via `update_estimate_totals()` function
- Estimate balance = total_amount - total_credits
- Estimate status logic is based on conversion status and amounts

### Status Logic:
- Converted: valid_final_create_invoice_clicked = true
- Draft: total_amount = 0
- Pending: Otherwise

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
    WHERE rowid_estimate_lines = estimate_id;
    
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
- Purchase Order totals are calculated from linked products
- PO balance = total_amount - total_paid
- Status is determined based on payment status

### Status Logic:
- Draft: total_amount = 0
- Complete: balance <= 0
- Partial: balance > 0 AND total_paid > 0
- Received: Otherwise

### Required Enhancements:
- Add functionality to properly track inventory received from purchase orders
- Update product integration with purchase orders

## 6. Materialized Views and Data Relationships

### Current Implementation:
The following materialized views exist:
- `mv_account_details` - Account information with balances
- `mv_product_vendor_details` - Products with vendor information
- `mv_purchase_order_vendor_details` - Purchase orders with vendor details
- `mv_invoice_customer_details` - Invoices with customer information
- `mv_estimate_customer_details` - Estimates with customer information

### Required Enhancements:
- Ensure all views are refreshed when related data changes
- Update views to include calculated fields like inventory levels
- Add calculated fields for account balances including sample-related effects

```sql
-- Example of updated materialized view for products
CREATE OR REPLACE VIEW mv_product_vendor_details AS
SELECT 
    p.id as product_id,
    p.glide_row_id as product_glide_id,
    p.display_name,
    p.new_product_name,
    p.vendor_product_name,
    p.cost,
    p.total_qty_purchased,
    p.category,
    p.product_image1,
    p.product_purchase_date,
    p.samples,
    p.fronted,
    p.miscellaneous_items,
    a.account_name as vendor_name,
    a.glide_row_id as vendor_glide_id,
    a.accounts_uid as vendor_uid,
    po.purchase_order_uid as po_number,
    po.po_date,
    calculate_product_inventory(p.glide_row_id) as current_inventory,
    COALESCE((SELECT SUM(qty_sold)
              FROM gl_invoice_lines
              WHERE rowid_products = p.glide_row_id), 0) as total_sold,
    COALESCE((SELECT SUM(el.qty_sold)
              FROM gl_estimate_lines el
              JOIN gl_estimates e ON el.rowid_estimate_lines = e.glide_row_id
              WHERE el.rowid_products = p.glide_row_id
              AND e.is_a_sample = true), 0) as total_sampled
FROM 
    gl_products p
LEFT JOIN 
    gl_accounts a ON p.rowid_accounts = a.glide_row_id
LEFT JOIN 
    gl_purchase_orders po ON p.rowid_purchase_orders = po.glide_row_id;
```

## 7. Business Operations and Metrics

### Current Implementation:
- Metrics are calculated using database functions
- Functions include:
  - `gl_get_business_stats()` - Overall business metrics
  - `gl_get_invoice_metrics()` - Invoice-specific metrics
  - `gl_get_purchase_order_metrics()` - Purchase order metrics
  - `gl_get_account_stats()` - Account-related stats
  - `gl_get_document_status()` - Document status breakdown

### Required Enhancements:
- Include sample product logic in metrics calculations
- Update metrics to reflect accurate inventory levels

## 8. Implementation Plan

### Phase 1: Database Schema and Function Updates
1. Update account balance calculation to include sample products
2. Create product inventory calculation function
3. Enhance materialized views with calculated fields

### Phase 2: Business Logic Implementation
1. Implement conversion of estimates to invoices
2. Update product inventory tracking logic
3. Enhance account balance calculations in the frontend

### Phase 3: Frontend Integration
1. Update dashboard to show new metrics
2. Add inventory indicators to product listing
3. Show account balances with appropriate positive/negative indicators

### Phase 4: Testing and Validation
1. Test inventory deduction on invoice creation
2. Validate sample product impact on vendor balances
3. Ensure account balance calculations are accurate

## 9. Conclusion and Next Steps

The current implementation handles basic calculations for invoices, estimates, and purchase orders well. The main gaps are in inventory tracking, especially for sample products, and in account balance calculations that incorporate all factors.

By implementing the proposed database functions and materialized view updates, we can achieve a comprehensive tracking system that reflects the business logic accurately. The next critical step is to implement the inventory calculation logic and update the account balance calculations to reflect the sample product impact.
