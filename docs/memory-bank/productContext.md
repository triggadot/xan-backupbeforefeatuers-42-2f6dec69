# Product Context

## Business Problem
Businesses need a comprehensive system to track financial transactions, manage inventory, and maintain relationships with customers and vendors. Traditional systems often lack the flexibility to handle the unique requirements of businesses that operate with both B2B and B2C models, especially when dealing with sample products, fronted inventory, and complex balance calculations.

## Solution Approach
Xan-1 provides a unified platform that:
1. Tracks all financial transactions (invoices, purchase orders, estimates)
2. Manages product inventory with proper relationships
3. Maintains customer and vendor accounts with accurate balance calculations
4. Generates professional PDF documents for business communications
5. Provides robust data management with type safety and consistent patterns

## User Experience Goals
- Intuitive navigation between related entities
- Clear visualization of financial status and balances
- Simplified document generation and sharing
- Comprehensive product inventory management
- Consistent, responsive UI with modern design patterns
- Type-safe data handling with proper error management

## Core Business Workflows

### 1. Invoice Management
- **Creation Flow**: User creates invoice → adds customer → adds line items → sets tax/dates → saves
- **Payment Flow**: User views invoice → records payment → system updates balances
- **PDF Flow**: User generates PDF → views preview → shares with customer
- **Data Requirements**:
  - Customer information for proper addressing and contact
  - Product details for line items
  - Payment information for tracking

### 2. Purchase Order Processing
- **Creation Flow**: User creates PO → selects vendor → adds products → sets terms → saves
- **Receiving Flow**: User marks products as received → updates inventory
- **Payment Flow**: User records vendor payment → system updates balances
- **Data Requirements**:
  - Vendor information
  - Product details (cost, quantity, descriptions)
  - Payment terms and tracking

### 3. Product Inventory Management
- **Addition Flow**: User creates product → assigns vendor → sets details → saves
- **Tracking Flow**: System tracks inventory as products are sold/purchased
- **Sample Handling**: Special tracking for sample products and fronted inventory
- **Data Requirements**:
  - Product details (name, cost, selling price)
  - Vendor relationship
  - Inventory quantities
  - Sample/fronted status

### 4. Account Management
- **Customer Flow**: User creates customer → tracks invoices → manages payments
- **Vendor Flow**: User creates vendor → tracks purchase orders → manages payments
- **Balance Tracking**: System calculates balances based on transactions
- **Data Requirements**:
  - Contact information
  - Transaction history
  - Balance calculations

## Business Logic Patterns

### 1. Balance Calculation Pattern
- **Customer Balance**: Sum of unpaid invoice amounts (positive means customer owes money)
  - Formula: `SUM(invoice.balance WHERE invoice.rowid_accounts = account.glide_row_id)`
- **Vendor Balance**: Sum of unpaid purchase order amounts (negative means company owes vendor)
  - Formula: `SUM(purchase_order.balance WHERE purchase_order.rowid_accounts = account.glide_row_id) * -1`
- **Net Balance**: `customer_balance + vendor_balance`

### 2. Payment Status Pattern
- **Invoice Status Logic**:
  - `draft`: total_amount = 0
  - `paid`: balance <= 0
  - `partial`: balance > 0 AND total_paid > 0
  - `unpaid`: balance > 0 AND total_paid = 0

- **Purchase Order Status Logic**:
  - `draft`: total_amount = 0
  - `complete`: balance <= 0
  - `partial`: balance > 0 AND total_paid > 0
  - `received`: balance > 0 AND total_paid = 0

### 3. Inventory Tracking Pattern
- **Current Inventory**: Original Purchase Quantity - Sold Quantity - Sample Quantity
- **Sold Quantity**: Sum of quantities from invoice lines
- **Sample Quantity**: Sum of quantities from sample-marked estimate lines
- **Product Status Tracking**:
  - Normal products: Standard inventory tracking
  - Sample products: Tracked separately but affects vendor balance
  - Fronted products: Special terms tracking with vendor
