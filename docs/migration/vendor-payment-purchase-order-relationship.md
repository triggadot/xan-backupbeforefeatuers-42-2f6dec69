# Vendor Payment to Purchase Order Relationship

## Overview

This document outlines the relationship between vendor payments and purchase orders in the Xan system. The relationship is bidirectional, allowing users to navigate between related entities.

## Data Model Relationships

### Database Schema

The relationship between vendor payments and purchase orders is maintained through the following database fields:

1. **In `gl_vendor_payments` table:**
   - `rowid_purchase_orders` - Foreign key to the purchase order record
   - `rowid_accounts` - Foreign key to the vendor account
   - `payment_amount` - Amount of the payment
   - `payment_method` - Method of payment
   - `date_of_payment` - Date the payment was made

2. **In `gl_purchase_orders` table:**
   - `total_paid` - Total amount paid across all payments for this purchase order
   - `balance` - Remaining amount to be paid (total_amount - total_paid)
   - `payment_status` - Status field that is updated based on payment activity ('PAID', 'PARTIAL', 'UNPAID')

## UI Components

### Navigation

The following components implement the bidirectional navigation:

1. **Purchase Order Detail View (`src/components/new/purchase-orders/PurchaseOrderDetailView.tsx`):**
   - Displays a payment history section showing all payments linked to the purchase order
   - Each payment can be navigated to via the payment view links
   - Includes functionality to add a new payment for the current purchase order

   ```typescript
   // Navigation to payment detail
   const handleViewPayment = (paymentId: string) => {
     navigate(`/vendor-payments/${paymentId}`);
   };

   // Navigation to add new payment for this purchase order
   const handleAddPayment = () => {
     navigate(`/vendor-payments/new?purchaseOrderId=${purchaseOrder?.id}`);
   };
   ```

2. **Vendor Payment Form (`src/components/payments/VendorPaymentForm.tsx`):**
   - Accepts a `purchaseOrderId` query parameter to pre-select the purchase order
   - Updates purchase order payment status, total_paid, and balance when a payment is added

### Data Flow

1. When a vendor payment is created:
   - The payment record is inserted with a reference to the purchase order
   - The purchase order's total_paid amount is updated
   - The purchase order's balance is recalculated
   - The purchase order's payment_status is updated based on the payment amount

2. When viewing a purchase order:
   - The related payments are fetched using the `useVendorPayments` hook
   - Payment history is displayed in a table or list format

## Implementation Details

### Types

1. **Vendor Payment Type (`src/types/vendorPayment.ts`):**
   ```typescript
   export interface VendorPayment extends EntityBase {
     /** Payment amount */
     amount: number;
     
     /** Date the payment was made */
     payment_date: string | Date;
     
     /** Method of payment (e.g., 'Check', 'Credit Card', 'Bank Transfer') */
     payment_method?: string;
     
     /** Additional notes about the payment */
     payment_notes?: string;
     
     /** Related purchase order ID */
     rowid_purchase_orders?: string;
     
     /** Related vendor account ID */
     rowid_accounts?: string;
   }
   ```

### Hooks

1. **useVendorPayments (`src/hooks/vendor/useVendorPayments.ts`):**
   - Fetches payments related to a specific purchase order
   - Provides functions for adding, updating, and deleting payments
   - Handles automatic updates to purchase order totals and status

### Services

1. **vendorPaymentsService (`src/services/supabase/gl-vendor-payments.ts`):**
   - Provides CRUD operations for vendor payments
   - Handles updating purchase order totals and status when payments change

## Migration Path

For any newly created components:

1. Use the `useVendorPayments` hook to fetch payments for a purchase order
2. Implement navigation to view or add payments
3. Use the `@/types/vendorPayment` types for type consistency

## Example Usage

```tsx
// In a purchase order detail component
const { payments, isLoading } = useVendorPayments(purchaseOrderId);

// Rendering payment history
<Card>
  <CardHeader>
    <CardTitle>Payment History</CardTitle>
    <Button onClick={handleAddPayment}>Add Payment</Button>
  </CardHeader>
  <CardContent>
    {payments.map(payment => (
      <div key={payment.id} className="flex justify-between">
        <div>
          <div>{payment.payment_method || 'Payment'}</div>
          <div>{formatDate(payment.payment_date)}</div>
          <div>{payment.payment_notes || ''}</div>
        </div>
        <div>
          {formatCurrency(payment.amount)}
        </div>
        <Button onClick={() => handleViewPayment(payment.id)}>
          View
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
``` 