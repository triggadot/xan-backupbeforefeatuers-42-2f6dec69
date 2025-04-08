# UID Generation System Documentation

This document describes the automatic UID generation system for invoices, purchase orders, and estimates in the Glidebase system.

## Overview

The system automatically generates unique identifiers (UIDs) for various document types following a consistent pattern:
- Invoices: `INV#{ACCOUNT_UID}{DATE}`
- Purchase Orders: `PO#{ACCOUNT_UID}{DATE}`
- Estimates: `EST#{ACCOUNT_UID}{DATE}` or `SMP#{ACCOUNT_UID}{DATE}` for samples

These UIDs are generated using database triggers that fire on insert and update operations, ensuring consistent and reliable identifier generation.

## Database Functions

### 1. `generate_invoice_uid(account_uid text, invoice_date timestamp with time zone)`

**Function Definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_invoice_uid(account_uid text, invoice_date timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'INV#' || COALESCE(account_uid, 'UNK') || TO_CHAR(COALESCE(invoice_date, CURRENT_TIMESTAMP), 'MMDDYY');
END;
$$;
```

**Parameters:**
- `account_uid` (text): The unique identifier of the associated account
- `invoice_date` (timestamp with time zone): The date of the invoice

**Return Value:**
- Returns a text string in the format `INV#{ACCOUNT_UID}{MMDDYY}`

**Purpose and Behavior:**
This function generates a unique identifier for invoices by combining the prefix "INV#" with the account UID and the date formatted as MMDDYY.

### 2. `generate_invoice_uid_trigger()`

**Function Definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_invoice_uid_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_account_uid text;
BEGIN
    -- Fetch the account uid if it exists
    SELECT accounts_uid INTO v_account_uid
    FROM gl_accounts
    WHERE glide_row_id = NEW.rowid_accounts
    LIMIT 1;
    
    -- Generate invoice_uid in the following cases:
    -- 1. If invoice_uid is NULL (new record or cleared value)
    -- 2. If rowid_accounts has changed (different account)
    -- 3. If invoice_order_date has changed (different date)
    IF NEW.invoice_uid IS NULL 
       OR (TG_OP = 'UPDATE' AND OLD.rowid_accounts IS DISTINCT FROM NEW.rowid_accounts)
       OR (TG_OP = 'UPDATE' AND OLD.invoice_order_date IS DISTINCT FROM NEW.invoice_order_date)
    THEN
        -- Using the custom function
        NEW.invoice_uid := generate_invoice_uid(v_account_uid, NEW.invoice_order_date);
    END IF;
    
    RETURN NEW;
END;
$$;
```

**Parameters:**
- None (Trigger function that operates on the NEW record)

**Return Value:**
- Returns the NEW record with the `invoice_uid` field populated

**Purpose and Behavior:**
This trigger function fetches the account UID and calls the `generate_invoice_uid` function to generate a unique identifier for invoices. It fires when:
1. A new invoice is created with a NULL `invoice_uid`
2. An invoice's `rowid_accounts` is changed
3. An invoice's `invoice_order_date` is changed

**Dependencies:**
- `gl_invoices` table with `invoice_uid`, `rowid_accounts`, and `invoice_order_date` columns
- `gl_accounts` table with `accounts_uid` and `glide_row_id` columns
- `generate_invoice_uid` function

### 3. `generate_po_uid(account_uid text, po_date timestamp with time zone)`

**Function Definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_po_uid(account_uid text, po_date timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'PO#' || COALESCE(account_uid, 'UNK') || TO_CHAR(COALESCE(po_date, CURRENT_TIMESTAMP), 'MMDDYY');
END;
$$;
```

**Parameters:**
- `account_uid` (text): The unique identifier of the associated account
- `po_date` (timestamp with time zone): The date of the purchase order

**Return Value:**
- Returns a text string in the format `PO#{ACCOUNT_UID}{MMDDYY}`

**Purpose and Behavior:**
This function generates a unique identifier for purchase orders by combining the prefix "PO#" with the account UID and the date formatted as MMDDYY.

### 4. `generate_po_uid_trigger()`

**Function Definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_po_uid_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_account_uid text;
BEGIN
    -- Fetch the account uid if it exists
    SELECT accounts_uid INTO v_account_uid
    FROM gl_accounts
    WHERE glide_row_id = NEW.rowid_accounts
    LIMIT 1;
    
    -- Generate purchase_order_uid in the following cases:
    -- 1. If purchase_order_uid is NULL (new record or cleared value)
    -- 2. If rowid_accounts has changed (different account)
    -- 3. If po_date has changed (different date)
    IF NEW.purchase_order_uid IS NULL 
       OR (TG_OP = 'UPDATE' AND OLD.rowid_accounts IS DISTINCT FROM NEW.rowid_accounts)
       OR (TG_OP = 'UPDATE' AND OLD.po_date IS DISTINCT FROM NEW.po_date)
    THEN
        -- Using the custom function
        NEW.purchase_order_uid := generate_po_uid(v_account_uid, NEW.po_date);
    END IF;
    
    RETURN NEW;
END;
$$;
```

**Parameters:**
- None (Trigger function that operates on the NEW record)

**Return Value:**
- Returns the NEW record with the `purchase_order_uid` field populated

**Purpose and Behavior:**
This trigger function fetches the account UID and calls the `generate_po_uid` function to generate a unique identifier for purchase orders. It fires when:
1. A new purchase order is created with a NULL `purchase_order_uid`
2. A purchase order's `rowid_accounts` is changed
3. A purchase order's `po_date` is changed

**Dependencies:**
- `gl_purchase_orders` table with `purchase_order_uid`, `rowid_accounts`, and `po_date` columns
- `gl_accounts` table with `accounts_uid` and `glide_row_id` columns
- `generate_po_uid` function

### 5. `generate_estimate_uid()`

**Function Definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_estimate_uid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    account_uid text;
    date_part text;
    prefix text;
BEGIN
    -- Get account_uid from gl_accounts
    SELECT accounts_uid INTO account_uid
    FROM gl_accounts
    WHERE glide_row_id = NEW.rowid_accounts;
    
    -- Format date part (mmddyy)
    IF NEW.estimate_date IS NOT NULL THEN
        date_part := to_char(NEW.estimate_date, 'MMDDYY');
    ELSE
        date_part := to_char(CURRENT_DATE, 'MMDDYY');
    END IF;
    
    -- Determine prefix based on is_a_sample flag
    IF NEW.is_a_sample IS TRUE THEN
        prefix := 'SMP#';
    ELSE
        prefix := 'EST#';
    END IF;
    
    -- Generate estimate_uid
    IF account_uid IS NOT NULL THEN
        NEW.estimate_uid := prefix || account_uid || date_part;
    ELSE
        NEW.estimate_uid := prefix || 'UNK' || date_part;
    END IF;
    
    RETURN NEW;
END;
$$;
```

**Parameters:**
- None (Trigger function that operates on the NEW record)

**Return Value:**
- Returns the NEW record with the `estimate_uid` field populated

**Purpose and Behavior:**
This trigger function generates a unique identifier for estimates. It uses "EST#" as the prefix for regular estimates and "SMP#" for sample estimates (when `is_a_sample` is TRUE). The function:
1. Fetches the account UID from the related account
2. Formats the date part as MMDDYY
3. Determines the prefix based on the `is_a_sample` flag
4. Combines these elements to create the estimate UID

**Dependencies:**
- `gl_estimates` table with `estimate_uid`, `rowid_accounts`, `estimate_date`, and `is_a_sample` columns
- `gl_accounts` table with `accounts_uid` and `glide_row_id` columns

## Triggers

### Invoice Triggers

```sql
CREATE TRIGGER generate_invoice_uid
BEFORE INSERT OR UPDATE ON public.gl_invoices
FOR EACH ROW WHEN (new.invoice_uid IS NULL)
EXECUTE FUNCTION generate_invoice_uid_trigger();
```

### Purchase Order Triggers

```sql
CREATE TRIGGER generate_po_uid
BEFORE INSERT OR UPDATE ON public.gl_purchase_orders
FOR EACH ROW WHEN (new.purchase_order_uid IS NULL)
EXECUTE FUNCTION generate_po_uid_trigger();
```

### Estimate Triggers

```sql
-- Insert trigger
CREATE TRIGGER generate_estimate_uid_insert_trigger 
BEFORE INSERT ON gl_estimates 
FOR EACH ROW WHEN (new.estimate_uid is null)
EXECUTE FUNCTION generate_estimate_uid();

-- Update trigger
CREATE TRIGGER generate_estimate_uid_update_trigger 
BEFORE UPDATE OF rowid_accounts, estimate_date, is_a_sample ON gl_estimates 
FOR EACH ROW WHEN (
  new.estimate_uid is null
  OR old.rowid_accounts IS DISTINCT FROM new.rowid_accounts
  OR old.estimate_date IS DISTINCT FROM new.estimate_date
  OR old.is_a_sample IS DISTINCT FROM new.is_a_sample
)
EXECUTE FUNCTION generate_estimate_uid();
```

## Usage Examples

### Invoice UID Generation

When a new invoice is created:
```sql
INSERT INTO gl_invoices (glide_row_id, rowid_accounts, invoice_order_date)
VALUES ('glide123', 'account456', '2025-04-08');
-- Result: invoice_uid = 'INV#ABC040825' (if account_uid = 'ABC')
```

When an invoice's account is changed:
```sql
UPDATE gl_invoices
SET rowid_accounts = 'account789'
WHERE glide_row_id = 'glide123';
-- Result: invoice_uid is regenerated with the new account_uid
```

### Purchase Order UID Generation

When a new purchase order is created:
```sql
INSERT INTO gl_purchase_orders (glide_row_id, rowid_accounts, po_date)
VALUES ('glide456', 'account456', '2025-04-08');
-- Result: purchase_order_uid = 'PO#ABC040825' (if account_uid = 'ABC')
```

### Estimate UID Generation

When a new regular estimate is created:
```sql
INSERT INTO gl_estimates (glide_row_id, rowid_accounts, estimate_date, is_a_sample)
VALUES ('glide789', 'account456', '2025-04-08', FALSE);
-- Result: estimate_uid = 'EST#ABC040825' (if account_uid = 'ABC')
```

When a new sample estimate is created:
```sql
INSERT INTO gl_estimates (glide_row_id, rowid_accounts, estimate_date, is_a_sample)
VALUES ('glide012', 'account456', '2025-04-08', TRUE);
-- Result: estimate_uid = 'SMP#ABC040825' (if account_uid = 'ABC')
```

## Error Handling

- If `rowid_accounts` references a non-existent account, the account_uid will be NULL and 'UNK' will be used in the UID
- If the date field is NULL, the current date will be used
- The triggers handle NULL values gracefully to prevent errors

## Performance Considerations

- The triggers use indexed fields (`glide_row_id` in `gl_accounts`) for efficient lookups
- The functions perform minimal database operations to ensure good performance
- The triggers only fire when necessary (when relevant fields change or are NULL)
