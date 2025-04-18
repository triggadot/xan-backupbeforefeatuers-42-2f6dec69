# Customer Payment to Invoice Relationship

## Overview

This document outlines the relationship between customer payments and invoices in the Xan system. The relationship is bidirectional, allowing users to navigate between related entities.

## Data Model Relationships

### Database Schema

The relationship between customer payments and invoices is maintained through the following database fields:

1. **In `gl_customer_payments` table:**
   - `rowid_invoices` - Foreign key to the invoice record in `gl_invoices`
   - `rowid_accounts` - Foreign key to the customer account in `gl_accounts`

2. **In `gl_invoices` table:**
   - `total_paid` - Total amount paid across all payments for this invoice
   - `balance` - Remaining amount to be paid (total_amount - total_paid)
   - `payment_status` - Status field that is updated based on payment activity ('PAID', 'PARTIAL', 'UNPAID')

## UI Components

### Navigation

The following components implement the bidirectional navigation:

1. **Invoice Detail View (`src/components/new/invoices/invoice-detail-view.tsx`):**
   - Displays a payment history section showing all payments linked to the invoice
   - Provides an "Add Payment" button that navigates to the payment form with the invoice pre-selected
   - Each payment row has a "View" button that navigates to the payment detail view

   ```typescript
   // Navigation to payment detail
   const handleViewPayment = (paymentId: string) => {
     navigate(`/customer-payments/${paymentId}`);
   };

   // Navigation to add new payment for this invoice
   const handleAddPayment = () => {
     navigate(`/customer-payments/new?invoiceId=${invoice.id}`);
   };
   ```

2. **Customer Payment Form (`src/components/payments/CustomerPaymentForm.tsx`):**
   - Accepts an `invoiceId` query parameter to pre-select the invoice
   - Updates invoice payment status, total_paid, and balance when a payment is added

### Data Flow

1. When a customer payment is created:
   - The payment record is inserted with a reference to the invoice
   - The invoice's total_paid amount is updated
   - The invoice's balance is recalculated
   - The invoice's payment_status is updated based on the payment amount

2. When viewing an invoice:
   - The related payments are fetched using the `useInvoicePayments` hook
   - Payment history is displayed in a table

## Implementation Details

### Types

1. **Invoice Payment Type (`src/types/invoice.ts`):**
   ```typescript
   interface InvoicePayment {
     id: string;
     invoiceId: string;
     accountId: string;
     amount: number;
     paymentDate: Date;
     paymentMethod?: string;
     notes?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

### Hooks

1. **useInvoicePayments (`src/hooks/invoices/useInvoicePayments.ts`):**
   - Fetches payments related to a specific invoice
   - Provides functions for adding, updating, and deleting payments
   - Handles automatic updates to invoice totals and status

### Services

1. **glInvoicePaymentsService (`src/services/supabase/gl-invoice-payments.ts`):**
   - Provides CRUD operations for customer payments
   - Handles updating invoice totals and status when payments change

## Migration Path

For any newly created components:

1. Use the `useInvoicePayments` hook to fetch payments for an invoice
2. Implement navigation to view or add payments
3. Use the `@/types/invoice` types for type consistency

## Example Usage

```tsx
// In an invoice detail component
const { payments, isLoading } = useInvoicePayments(invoiceId);

// Rendering payment history
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Method</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {payments.map((payment) => (
      <TableRow key={payment.id}>
        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
        <TableCell>{payment.paymentMethod || 'N/A'}</TableCell>
        <TableCell>{formatCurrency(payment.amount)}</TableCell>
        <TableCell>
          <Button onClick={() => navigateToPayment(payment.id)}>
            View
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
``` 