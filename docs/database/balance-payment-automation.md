# Account Balance and Payment Automation System Documentation

This document describes the automated calculation and updating of account balances (`customer_balance`, `vendor_balance`, `balance`) within the `gl_accounts` table and how payments relate to this system.

## Overview

The system ensures that the financial standing represented in the `gl_accounts` table is always up-to-date based on transactions recorded in related tables (invoices, estimates, purchase orders). This automation is achieved through PostgreSQL functions and triggers, minimizing manual calculations and potential errors.

The core principle is that the `balance` in `gl_accounts` is derived from two key components: `customer_balance` (money owed to the company) and `vendor_balance` (money owed by the company).

## Core Balance Columns (`gl_accounts`)

These columns reside directly in the `gl_accounts` table and are automatically updated.

### 1. `customer_balance`

*   **Purpose:** Represents the total amount owed *to* the company by this account holder.
*   **Calculation Logic:**
    ```sql
    -- Sum of balances from all linked invoices
    (SELECT COALESCE(SUM(i.balance), 0.00) 
     FROM gl_invoices i 
     WHERE i.rowid_accounts = target_account_id)
    +
    -- Sum of balances from linked, unconverted sample estimates
    (SELECT COALESCE(SUM(e.balance), 0.00) 
     FROM gl_estimates e 
     WHERE e.rowid_accounts = target_account_id 
       AND e.is_a_sample = true 
       AND e.status != 'converted');
    ```
*   **Related Tables:** `gl_invoices`, `gl_estimates`
*   **Trigger Mechanism:** Automatically recalculated and updated by triggers on `gl_invoices` and `gl_estimates` whenever relevant fields (like `balance`, `rowid_accounts`, `is_a_sample`, `status`) change.

### 2. `vendor_balance`

*   **Purpose:** Represents the total amount owed *by* the company to this vendor account.
*   **Calculation Logic (Simplified):**
    ```sql
    -- Sum of balances from all linked purchase orders (negated)
    (SELECT COALESCE(SUM(po.balance), 0.00) * -1 
     FROM gl_purchase_orders po 
     WHERE po.rowid_accounts = target_account_id);
    ```
    *Note: Logic involving `gl_products` (samples/fronted) was previously considered but removed for simplification. Balance is now solely based on Purchase Orders.*
*   **Related Tables:** `gl_purchase_orders`
*   **Trigger Mechanism:** Automatically recalculated and updated by a trigger on `gl_purchase_orders` whenever `balance` or `rowid_accounts` changes.

### 3. `balance`

*   **Purpose:** Represents the final net financial standing of the account.
*   **Calculation Logic:**
    ```sql
    balance = customer_balance + vendor_balance
    ```
*   **Related Tables:** `gl_accounts` (uses `customer_balance`, `vendor_balance` from the same row).
*   **Trigger Mechanism:** Automatically recalculated via a `BEFORE UPDATE` trigger (`trigger_update_main_balance_on_account_change`) on the `gl_accounts` table itself whenever `customer_balance` or `vendor_balance` is updated.

## Related Entity Balances

The balances in `gl_accounts` are derived from the balances maintained in related transaction tables:

*   **`gl_invoices.balance`:** Represents the amount outstanding on a specific invoice. This balance is typically reduced when records are created in `gl_customer_payments` linked to the invoice.
*   **`gl_estimates.balance`:** Represents the amount on an estimate. For the purposes of `customer_balance`, only *unconverted sample* estimates contribute.
*   **`gl_purchase_orders.balance`:** Represents the amount outstanding on a specific purchase order. This balance is typically reduced when records are created in `gl_vendor_payments` linked to the purchase order.

## Payment Handling

Payments are recorded in separate tables:

*   `gl_customer_payments`: Linked to `gl_invoices` (via `rowid_invoices`). Creating/updating payments here typically triggers updates to the corresponding `gl_invoices.balance`.
*   `gl_vendor_payments`: Linked to `gl_purchase_orders` (via `rowid_purchase_orders`). Creating/updating payments here typically triggers updates to the corresponding `gl_purchase_orders.balance`.

The crucial point is that payment tables *indirectly* affect the `gl_accounts` balances by first modifying the balance of the linked invoice or purchase order. The triggers on *those* tables (`gl_invoices`, `gl_purchase_orders`) then cause the respective `customer_balance` or `vendor_balance` in `gl_accounts` to be recalculated.

## Implementation Details

*   **Language:** PL/pgSQL (PostgreSQL's procedural language).
*   **Mechanism:** Database Triggers and Functions.
*   **Key Functions (Examples):**
    *   `calculate_customer_balance_for_account` (or similar name - handles customer logic)
    *   `calculate_vendor_balance_for_account` (handles vendor logic - simplified to POs only)
    *   `update_account_vendor_balance` (updates the column)
    *   `handle_vendor_balance_update` (trigger function for POs)
    *   `update_main_balance_from_components` (trigger function for main balance update)
    *   (Similar functions/handlers exist for customer balance based on invoices/estimates).
