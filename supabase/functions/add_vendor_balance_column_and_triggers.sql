-- Migration: REVISED SIMPLIFIED - Add/Update vendor_balance (PO only) and balance columns, functions, triggers.

-- Step 0: Drop dependent trigger first
DROP TRIGGER IF EXISTS trigger_update_main_balance_on_account_change ON public.gl_accounts;

-- Step 1: Ensure columns are standard numeric, not generated
ALTER TABLE public.gl_accounts DROP COLUMN IF EXISTS vendor_balance;
ALTER TABLE public.gl_accounts ADD COLUMN IF NOT EXISTS vendor_balance numeric DEFAULT 0.00;
COMMENT ON COLUMN public.gl_accounts.vendor_balance IS '[REVISED SIMPLIFIED v2] Calculated balance representing total amount owed to this vendor account based ONLY on PO balances.';

-- Step 2: Drop the old calculation function if it exists
DROP FUNCTION IF EXISTS public.gl_calculate_account_balance(uuid);

-- 1. REVISED function to calculate vendor balance for a specific account
CREATE OR REPLACE FUNCTION public.calculate_vendor_balance_for_account(p_glide_row_id text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
/**
 * @function calculate_vendor_balance_for_account [REVISED]
 * @description Calculates the total outstanding vendor balance for a given account.
 * This includes the negative sum of balances from associated purchase orders.
 * Represents the total amount the company owes to this vendor account.
 *
 * @param {text} p_glide_row_id - The glide_row_id of the gl_accounts record.
 * @returns {numeric} The calculated vendor balance (typically zero or negative). Returns 0.00 if no associated records are found.
 *
 * @example
 * SELECT public.calculate_vendor_balance_for_account('account_row_id_123');
 */
DECLARE
    v_po_balance numeric;
    v_total_balance numeric;
BEGIN
    -- Sum of balances from related purchase orders (negated as it's money owed)
    SELECT COALESCE(SUM(po.balance), 0.00) * -1
    INTO v_po_balance
    FROM public.gl_purchase_orders po
    WHERE po.rowid_accounts = p_glide_row_id;

    -- Calculate total balance
    v_total_balance := v_po_balance;

    RETURN COALESCE(v_total_balance, 0.00);
END;
$$;

-- 2. Function to update the vendor_balance in gl_accounts (No change in signature, uses revised calculation)
CREATE OR REPLACE FUNCTION public.update_account_vendor_balance(p_glide_row_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
/**
 * @function update_account_vendor_balance
 * @description Calculates and updates the vendor_balance column for a specific account
 * in the gl_accounts table using the revised calculate_vendor_balance_for_account function.
 *
 * @param {text} p_glide_row_id - The glide_row_id of the gl_accounts record to update.
 * @returns {void}
 */
DECLARE
    v_calculated_balance numeric;
BEGIN
    v_calculated_balance := public.calculate_vendor_balance_for_account(p_glide_row_id);
    UPDATE public.gl_accounts
    SET vendor_balance = v_calculated_balance
    WHERE glide_row_id = p_glide_row_id;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error updating vendor balance for account %: %', p_glide_row_id, SQLERRM;
END;
$$;

-- 3. Trigger function handler for vendor balance updates (Adjusted watched columns for products)
CREATE OR REPLACE FUNCTION public.handle_vendor_balance_update()
RETURNS TRIGGER AS $$
/**
 * @function handle_vendor_balance_update (TRIGGER) [REVISED COLUMNS]
 * @description Trigger function attached to gl_purchase_orders, gl_products, and gl_vendor_payments.
 * Calls `update_account_vendor_balance` for relevant accounts based on changes.
 * Adjusted product columns being watched.
 *
 * @returns {TRIGGER} Returns NULL.
 */
DECLARE
    v_account_to_update text;
    v_product_account text;
    v_po_account text;
BEGIN
    -- Determine the primary account glide_row_id based on the changed row
    IF (TG_OP = 'DELETE') THEN
        v_account_to_update := OLD.rowid_accounts;
    ELSE -- INSERT or UPDATE
        v_account_to_update := NEW.rowid_accounts;
    END IF;

    -- Update the directly linked account first (if any)
    IF v_account_to_update IS NOT NULL THEN
        PERFORM public.update_account_vendor_balance(v_account_to_update);
    END IF;

    -- Handle cascading updates / updates to related accounts
    IF (TG_OP = 'DELETE') THEN
        IF TG_TABLE_NAME = 'gl_purchase_orders' THEN
             FOR v_product_account IN SELECT p.rowid_accounts FROM public.gl_products p WHERE p.rowid_purchase_orders = OLD.glide_row_id AND p.rowid_accounts IS NOT NULL LOOP
                IF v_product_account IS DISTINCT FROM OLD.rowid_accounts THEN PERFORM public.update_account_vendor_balance(v_product_account); END IF;
             END LOOP;
        END IF;
        -- Note: Deleting a vendor payment no longer directly impacts vendor balance under the new logic, only product linkage does.

    ELSIF (TG_OP = 'INSERT') THEN
        -- Note: Inserting a vendor payment no longer directly impacts vendor balance.
        NULL; -- Placeholder

    ELSIF (TG_OP = 'UPDATE') THEN
         -- If rowid_accounts changed, update the OLD account as well.
         IF OLD.rowid_accounts IS DISTINCT FROM NEW.rowid_accounts THEN
             IF OLD.rowid_accounts IS NOT NULL THEN PERFORM public.update_account_vendor_balance(OLD.rowid_accounts); END IF;
         END IF;

         -- If product's PO link changes
         IF TG_TABLE_NAME = 'gl_products' AND OLD.rowid_purchase_orders IS DISTINCT FROM NEW.rowid_purchase_orders THEN
             IF OLD.rowid_purchase_orders IS NOT NULL THEN
                 SELECT rowid_accounts INTO v_po_account FROM public.gl_purchase_orders WHERE glide_row_id = OLD.rowid_purchase_orders;
                 IF v_po_account IS NOT NULL AND v_po_account IS DISTINCT FROM OLD.rowid_accounts AND v_po_account IS DISTINCT FROM NEW.rowid_accounts THEN PERFORM public.update_account_vendor_balance(v_po_account); END IF;
             END IF;
             IF NEW.rowid_purchase_orders IS NOT NULL THEN
                 SELECT rowid_accounts INTO v_po_account FROM public.gl_purchase_orders WHERE glide_row_id = NEW.rowid_purchase_orders;
                 IF v_po_account IS NOT NULL AND v_po_account IS DISTINCT FROM OLD.rowid_accounts AND v_po_account IS DISTINCT FROM NEW.rowid_accounts THEN PERFORM public.update_account_vendor_balance(v_po_account); END IF;
             END IF;
         END IF;

         -- If product's direct account link changes (already handled by IF OLD.rowid_accounts... above)
         -- If product's sample_or_fronted status changes (handled by trigger watching this column)
         -- If product's total_cost changes (handled by trigger watching this column)

         -- Changes in gl_vendor_payments links don't directly affect vendor_balance anymore.
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers on relevant tables (Adjusted watched columns for gl_products)
DROP TRIGGER IF EXISTS trigger_update_vendor_balance_on_po_change ON public.gl_purchase_orders;
CREATE TRIGGER trigger_update_vendor_balance_on_po_change
AFTER INSERT OR UPDATE OF balance, rowid_accounts OR DELETE ON public.gl_purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_vendor_balance_update();

-- Trigger on gl_vendor_payments is NO LONGER NEEDED for vendor_balance calculation under revised logic
DROP TRIGGER IF EXISTS trigger_update_vendor_balance_on_vendor_payment_change ON public.gl_vendor_payments;

-- 5. Main balance update function (No change needed)
CREATE OR REPLACE FUNCTION public.update_main_balance_from_components()
RETURNS TRIGGER AS $$
/**
 * @function update_main_balance_from_components (TRIGGER)
 * @description Trigger function for gl_accounts. Updates the main `balance` column
 * by summing the `customer_balance` and `vendor_balance` whenever those columns change.
 * Executes BEFORE UPDATE to set the correct value.
 *
 * @returns {TRIGGER} Returns the NEW row.
 */
BEGIN
    NEW.balance := COALESCE(NEW.customer_balance, 0.00) + COALESCE(NEW.vendor_balance, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. NEW: Trigger on gl_accounts to update main balance
-- Moved to the end

-- 7. Backfill function for vendor balances (No change needed, uses updated calculation)
CREATE OR REPLACE FUNCTION public.backfill_all_vendor_balances()
RETURNS void AS $$
/**
 * @function backfill_all_vendor_balances
 * @description Recalculates and updates the vendor_balance for all existing accounts.
 * Uses the currently defined `update_account_vendor_balance` function.
 * @returns {void}
 */
DECLARE
    v_account_glide_row_id text;
BEGIN
    RAISE NOTICE 'Starting REVISED vendor balance backfill...';
    FOR v_account_glide_row_id IN SELECT glide_row_id FROM public.gl_accounts LOOP
        PERFORM public.update_account_vendor_balance(v_account_glide_row_id);
    END LOOP;
    RAISE NOTICE 'REVISED Vendor balance backfill complete.';
END;
$$ LANGUAGE plpgsql;

-- 8. Backfill function for the main account balance (No change needed)
CREATE OR REPLACE FUNCTION public.backfill_main_account_balances()
RETURNS void AS $$
/**
 * @function backfill_main_account_balances
 * @description Updates the main `balance` column for all accounts based on their
 * current `customer_balance` and `vendor_balance`.
 * @returns {void}
 */
DECLARE
    v_account_glide_row_id text;
BEGIN
    RAISE NOTICE 'Starting main account balance backfill...';
    UPDATE public.gl_accounts
    SET balance = COALESCE(customer_balance, 0.00) + COALESCE(vendor_balance, 0.00);
    RAISE NOTICE 'Main account balance backfill complete. % rows updated.', (SELECT count(*) FROM public.gl_accounts);
END;
$$ LANGUAGE plpgsql;

-- Step 9: Recreate the main balance trigger AFTER vendor balance setup is complete
DROP TRIGGER IF EXISTS trigger_update_main_balance_on_account_change ON public.gl_accounts;
CREATE TRIGGER trigger_update_main_balance_on_account_change
BEFORE UPDATE OF customer_balance, vendor_balance ON public.gl_accounts
FOR EACH ROW
WHEN (OLD.customer_balance IS DISTINCT FROM NEW.customer_balance OR OLD.vendor_balance IS DISTINCT FROM NEW.vendor_balance)
EXECUTE FUNCTION public.update_main_balance_from_components();

-- Execution of backfills will be done separately
-- SELECT public.backfill_all_vendor_balances();
-- SELECT public.backfill_main_account_balances();
