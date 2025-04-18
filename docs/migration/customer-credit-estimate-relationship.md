# Customer Credit to Estimate Relationship

## Overview

This document outlines the relationship between customer credits and estimates in the Xan system. Customer credits can be applied to estimates to reduce the total amount due, and this relationship is maintained bidirectionally between the entities.

## Data Model Relationships

### Database Schema

The relationship between customer credits and estimates is maintained through the following database fields:

1. **In `gl_customer_credits` table:**
   - `rowid_estimates` - Foreign key to the estimate record
   - `rowid_accounts` - Foreign key to the customer account
   - `payment_amount` - Amount of the credit
   - `payment_type` - Type of credit
   - `date_of_payment` - Date the credit was created

2. **In `gl_estimates` table:**
   - `total_credits` - Total amount of credits applied to this estimate
   - `balance` - Remaining amount to be paid (total_amount - total_credits)
   - `status` - Status field that may be impacted by credit activity

## UI Components

### Navigation

The following components implement the bidirectional navigation:

1. **Estimate Detail View (`src/components/new/estimates/estimate-detail-view.tsx`):**
   - Displays credits applied to the estimate
   - May include functionality to apply new credits

   ```typescript
   // Example of credits section in estimate detail view
   {estimate.credits && estimate.credits.length > 0 && (
     <div className="flex justify-between text-sm">
       <span>Credits Applied:</span>
       <span className="text-green-600">{formatCurrency(estimate.total_credits || 0)}</span>
     </div>
   )}
   ```

2. **Customer Credit Form (`src/components/payments/CustomerCreditForm.tsx`):**
   - Allows selection of an estimate to apply a credit to
   - Updates estimate totals and balance when a credit is applied

### Data Flow

1. When a customer credit is created and applied to an estimate:
   - The credit record is inserted with a reference to the estimate
   - The estimate's total_credits amount is updated
   - The estimate's balance is recalculated
   - The estimate's status may be updated based on the credit amount

2. When viewing an estimate:
   - Applied credits are shown as part of the estimate totals
   - Credits reduce the balance due on the estimate

## Implementation Details

### Types

1. **Customer Credit Type (`src/types/estimates/index.ts`):**
   ```typescript
   export interface CustomerCredit {
     /** Credit ID */
     id: string;
     /** Glide row ID */
     glide_row_id: string;
     /** Foreign key to invoice */
     rowid_invoices?: string;
     /** Foreign key to estimate */
     rowid_estimates?: string;
     /** Foreign key to customer account */
     rowid_accounts?: string;
     /** Payment amount */
     payment_amount: number;
     /** Payment note */
     payment_note?: string;
     /** Payment type */
     payment_type?: string;
     /** Date of payment */
     date_of_payment?: string;
     /** Created timestamp */
     created_at: string;
     /** Updated timestamp */
     updated_at: string;
   }
   ```

### Hooks

1. **useCustomerCredits:**
   - Fetches credits related to a specific estimate
   - Provides functions for adding, updating, and deleting credits
   - Handles automatic updates to estimate totals and balance

### Services

1. **customerCreditsService:**
   - Provides CRUD operations for customer credits
   - Handles updating estimate totals and balance when credits change

## Migration Path

For any newly created components:

1. Create and use a proper hook for fetching and managing customer credits
2. Implement consistent navigation between estimates and credits
3. Use the types from `@/types/estimates` for type consistency

## Example Usage

```tsx
// In an estimate detail component
const { credits, isLoading } = useEstimateCredits(estimateId);

// Rendering credits applied to an estimate
<div className="mt-6 flex justify-end">
  <div className="w-full max-w-xs space-y-2">
    <div className="flex justify-between text-sm text-gray-600 font-semibold">
      <span>Estimate Total:</span>
      <span>{formatCurrency(estimate.total_amount || 0)}</span>
    </div>
    
    {credits?.length > 0 && (
      <div className="flex justify-between text-sm">
        <span>Credits Applied:</span>
        <span className="text-green-600">
          -{formatCurrency(
            credits.reduce((total, credit) => total + Number(credit.payment_amount || 0), 0)
          )}
        </span>
      </div>
    )}
    
    <div className="flex justify-between font-bold text-lg border-t pt-2">
      <span>Balance Due:</span>
      <span>{formatCurrency(estimate.balance || 0)}</span>
    </div>
  </div>
</div>
``` 