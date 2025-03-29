# Glidebase Sync Database Functions

## Overview

This document details the PostgreSQL functions used in the Glidebase sync system. These functions handle the complex logic required for proper data synchronization between Glide Apps and Supabase.

## Core Functions

### `glsync_master_control()`

This function completely overrides all PostgreSQL rules and constraints during sync operations to allow for inconsistent data.

```sql
CREATE OR REPLACE FUNCTION public.glsync_master_control()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Completely disable all triggers during sync operations
  SET session_replication_role = 'replica';
  
  -- Set a session variable to indicate we're in glsync mode
  -- This can be checked by other functions/triggers if needed
  SET LOCAL "app.glsync_mode" = 'true';
  
  -- Log the start of sync mode
  RAISE NOTICE 'GLSYNC: Entering override mode - all constraints and triggers disabled';
END;
$$;
```

**Purpose:**
- Completely disables all PostgreSQL constraints and triggers during sync
- Sets a session variable to indicate sync mode is active
- Provides logging for debugging purposes
- Allows for inconsistent data to be synced from Glide

### `glsync_estimate_lines(data JSONB)`

This specialized function handles the synchronization of estimate lines with proper relationship management.

```sql
CREATE OR REPLACE FUNCTION public.glsync_estimate_lines(data JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  v_glide_row_id TEXT;
  v_rowid_estimates TEXT;
  v_rowid_products TEXT;
  v_sale_product_name TEXT;
  v_qty_sold NUMERIC;
  v_selling_price NUMERIC;
  v_product_sale_note TEXT;
  v_date_of_sale TIMESTAMP;
  v_created_at TIMESTAMP;
  v_updated_at TIMESTAMP;
  v_estimate_exists BOOLEAN;
  v_product_exists BOOLEAN;
BEGIN
  -- Call master control to disable all constraints and triggers
  PERFORM public.glsync_master_control();
  
  -- Process each item in the data array
  FOR item IN SELECT * FROM jsonb_array_elements(data)
  LOOP
    -- Extract values from the item
    v_glide_row_id := item->>'glide_row_id';
    v_rowid_estimates := item->>'rowid_estimates';
    v_rowid_products := item->>'rowid_products';
    v_sale_product_name := item->>'sale_product_name';
    v_qty_sold := (item->>'qty_sold')::NUMERIC;
    v_selling_price := (item->>'selling_price')::NUMERIC;
    v_product_sale_note := item->>'product_sale_note';
    v_date_of_sale := (item->>'date_of_sale')::TIMESTAMP;
    v_created_at := COALESCE((item->>'created_at')::TIMESTAMP, now());
    v_updated_at := COALESCE((item->>'updated_at')::TIMESTAMP, now());
    
    -- Verify estimate exists (create placeholder if needed)
    IF v_rowid_estimates IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM public.gl_estimates WHERE glide_row_id = v_rowid_estimates) INTO v_estimate_exists;
      IF NOT v_estimate_exists THEN
        -- Create a placeholder estimate if it doesn't exist
        INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
        VALUES (v_rowid_estimates, now(), now())
        ON CONFLICT (glide_row_id) DO NOTHING;
      END IF;
    END IF;
    
    -- Verify product exists (create placeholder if needed)
    IF v_rowid_products IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM public.gl_products WHERE glide_row_id = v_rowid_products) INTO v_product_exists;
      IF NOT v_product_exists THEN
        -- Create a placeholder product if it doesn't exist
        INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
        VALUES (v_rowid_products, now(), now())
        ON CONFLICT (glide_row_id) DO NOTHING;
      END IF;
    END IF;
    
    -- Insert or update the estimate line
    INSERT INTO public.gl_estimate_lines (
      glide_row_id,
      rowid_estimates,
      rowid_products,
      sale_product_name,
      qty_sold,
      selling_price,
      product_sale_note,
      date_of_sale,
      created_at,
      updated_at,
      display_name
    ) VALUES (
      v_glide_row_id,
      v_rowid_estimates,
      v_rowid_products,
      v_sale_product_name,
      v_qty_sold,
      v_selling_price,
      v_product_sale_note,
      v_date_of_sale,
      v_created_at,
      v_updated_at,
      COALESCE(v_sale_product_name, 'Product ' || v_rowid_products)
    )
    ON CONFLICT (glide_row_id) DO UPDATE SET
      rowid_estimates = EXCLUDED.rowid_estimates,
      rowid_products = EXCLUDED.rowid_products,
      sale_product_name = EXCLUDED.sale_product_name,
      qty_sold = EXCLUDED.qty_sold,
      selling_price = EXCLUDED.selling_price,
      product_sale_note = EXCLUDED.product_sale_note,
      date_of_sale = EXCLUDED.date_of_sale,
      updated_at = now(),
      display_name = COALESCE(EXCLUDED.sale_product_name, 'Product ' || EXCLUDED.rowid_products);
  END LOOP;
  
  -- Call cleanup function to fix inconsistencies and restore constraints
  PERFORM public.glsync_master_cleanup();
END;
$$;
```

### `glsync_master_cleanup()`

This function re-enables constraints, fixes inconsistent data, and updates calculated fields after sync.

```sql
CREATE OR REPLACE FUNCTION public.glsync_master_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fixed_records INTEGER := 0;
BEGIN
  -- First, attempt to fix any inconsistent data before re-enabling constraints
  
  -- 1. Fix missing estimate references
  INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
  SELECT DISTINCT el.rowid_estimates, now(), now()
  FROM public.gl_estimate_lines el
  LEFT JOIN public.gl_estimates e ON el.rowid_estimates = e.glide_row_id
  WHERE el.rowid_estimates IS NOT NULL
    AND e.glide_row_id IS NULL;
  
  GET DIAGNOSTICS v_fixed_records = ROW_COUNT;
  IF v_fixed_records > 0 THEN
    RAISE NOTICE 'GLSYNC: Created % missing estimate records', v_fixed_records;
  END IF;
  
  -- 2. Fix missing product references
  INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
  SELECT DISTINCT el.rowid_products, now(), now()
  FROM public.gl_estimate_lines el
  LEFT JOIN public.gl_products p ON el.rowid_products = p.glide_row_id
  WHERE el.rowid_products IS NOT NULL
    AND p.glide_row_id IS NULL;
  
  GET DIAGNOSTICS v_fixed_records = ROW_COUNT;
  IF v_fixed_records > 0 THEN
    RAISE NOTICE 'GLSYNC: Created % missing product records', v_fixed_records;
  END IF;
  
  -- 3. Update display names
  UPDATE public.gl_estimate_lines el
  SET display_name = COALESCE(
    el.sale_product_name,
    p.new_product_name,
    p.vendor_product_name,
    'Product ' || el.rowid_products
  )
  FROM public.gl_products p
  WHERE el.rowid_products = p.glide_row_id
    AND (el.display_name IS NULL OR el.display_name = '');
  
  GET DIAGNOSTICS v_fixed_records = ROW_COUNT;
  IF v_fixed_records > 0 THEN
    RAISE NOTICE 'GLSYNC: Fixed % missing display names', v_fixed_records;
  END IF;
  
  -- 4. Update estimate totals
  UPDATE public.gl_estimates e
  SET total_amount = COALESCE(subquery.total, 0)
  FROM (
    SELECT 
      rowid_estimates, 
      SUM(qty_sold * selling_price) as total
    FROM 
      public.gl_estimate_lines
    GROUP BY 
      rowid_estimates
  ) as subquery
  WHERE e.glide_row_id = subquery.rowid_estimates;
  
  -- 5. Clear the session variable
  SET LOCAL "app.glsync_mode" = 'false';
  
  -- 6. Re-enable all triggers and constraints
  SET session_replication_role = 'origin';
  
  RAISE NOTICE 'GLSYNC: Exiting override mode - constraints and triggers restored';
END;
$$;
```

**Purpose:**
- Automatically fixes inconsistent data before re-enabling constraints
- Creates missing related records to maintain referential integrity
- Updates display names and calculated fields
- Provides detailed logging of all fixes for later review
- Restores normal database operation after sync

## Auxiliary Functions

### `set_estimate_line_display_name()`

Trigger function that sets the display name for estimate lines.

```sql
CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sale_product_name IS NOT NULL THEN
    NEW.display_name := NEW.sale_product_name;
  ELSIF NEW.rowid_products IS NOT NULL THEN
    SELECT COALESCE(new_product_name, vendor_product_name) INTO NEW.display_name
    FROM public.gl_products
    WHERE glide_row_id = NEW.rowid_products;
  END IF;
  
  IF NEW.display_name IS NULL THEN
    NEW.display_name := 'Product ' || NEW.rowid_products;
  END IF;
  
  RETURN NEW;
END;
$$;
```

### `update_estimate_total()`

Trigger function that updates the total amount for an estimate.

```sql
CREATE OR REPLACE FUNCTION public.update_estimate_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the estimate's total_amount
  UPDATE public.gl_estimates
  SET total_amount = (
    SELECT COALESCE(SUM(qty_sold * selling_price), 0)
    FROM public.gl_estimate_lines
    WHERE rowid_estimates = NEW.rowid_estimates
  )
  WHERE glide_row_id = NEW.rowid_estimates;
  
  RETURN NEW;
END;
$$;
