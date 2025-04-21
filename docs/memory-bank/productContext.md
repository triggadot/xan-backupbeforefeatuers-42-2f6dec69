# Product Context

## Business Problem
Businesses need a comprehensive system to track financial transactions, manage inventory, and maintain relationships with customers and vendors. Traditional systems often lack the flexibility to handle the unique requirements of businesses that operate with both B2B and B2C models, especially when dealing with sample products, fronted inventory, and complex balance calculations.

## Solution Approach
Xan-1 provides a unified platform that:
1. Tracks all financial transactions (invoices, purchase orders, estimates)
2. Manages product inventory with proper relationships
3. Maintains customer and vendor accounts with accurate balance calculations
4. Generates professional PDF documents for business communications
5. Synchronizes data with Glide Apps for mobile accessibility

## User Experience Goals
- Intuitive navigation between related entities (accounts → invoices → products)
- Clear visualization of financial status and balances
- Simplified document generation and sharing
- Comprehensive product inventory management
- Efficient data entry and relationship mapping

## Core Workflows
1. **Invoice Management**: Create invoices, add line items, track payments, generate PDFs
2. **Purchase Order Processing**: Create POs for vendors, track product deliveries and payments
3. **Estimate Handling**: Create estimates, convert to invoices when approved
4. **Account Management**: Track customer and vendor information, monitor balances
5. **Product Inventory**: Manage product details, track relationships with invoices/POs
6. **Data Synchronization**: Maintain data consistency between Supabase and Glide Apps

## Balance Calculation Business Logic
1. **Account Balance Calculation**:
   - `customer_balance`: Money owed TO the company from customers
     - Calculated from: `(SUM(gl_invoices.balance WHERE rowid_accounts=acc.id)) + (SUM(gl_estimates.balance WHERE rowid_accounts=acc.id AND is_a_sample=true AND status!='converted'))`
   - `vendor_balance`: Money owed BY the company to vendors
     - Calculated from: `SUM(gl_purchase_orders.balance) * -1` where `rowid_accounts=acc.id`
   - `balance`: Net account balance 
     - Calculated as: `customer_balance + vendor_balance`

2. **Invoice Payment Status Logic**:
   - If `total_amount = 0`, status is `draft`
   - If `balance < 0`, status is `credit`
   - If `balance = 0` AND `total_amount > 0`, status is `paid`
   - If `total_paid > 0` AND `balance > 0`, status is `partial`
   - Otherwise (`total_paid = 0` AND `balance > 0`), status is `unpaid`

3. **Product Display Logic**:
   - Primary name display: Use `new_product_name` if available, otherwise fall back to `vendor_product_name`
   - For invoice lines: Use `line.product_name_display`, then `line.renamed_product_name`, then `product.vendor_product_name`
