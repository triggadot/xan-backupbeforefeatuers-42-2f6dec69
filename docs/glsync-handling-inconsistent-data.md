# Handling Inconsistent Data in Glidebase Sync

## Overview

The Glidebase sync system is designed to handle inconsistent data from Glide Apps, ensuring that sync operations always succeed even when the data doesn't meet normal database constraints. This document explains the approach and mechanisms used to achieve this.

## The Challenge

Glide Apps often contain data that doesn't perfectly align with database constraints:

1. **Missing Relationships**: Records may reference non-existent parent records
2. **Incomplete Data**: Required fields might be empty or null
3. **Inconsistent Types**: Data types might not match expected formats
4. **Timing Issues**: Related records might arrive in an unpredictable order

## The Solution: Complete Override Mode

The Glidebase sync system uses a "Complete Override Mode" during sync operations:

### 1. Disabling All Constraints

When sync begins, the system calls `glsync_master_control()` which:

```sql
-- Completely disable all triggers during sync operations
SET session_replication_role = 'replica';

-- Set a session variable to indicate we're in glsync mode
SET LOCAL "app.glsync_mode" = 'true';
```

Setting `session_replication_role = 'replica'` is a PostgreSQL feature that:
- Disables ALL triggers (including foreign key constraint triggers)
- Bypasses check constraints
- Allows operations that would normally be rejected

### 2. Accepting All Data

During override mode, the system:
- Accepts references to non-existent parent records
- Allows NULL values in normally required fields
- Performs minimal validation on incoming data

### 3. Automatic Data Repair

After sync completes, before re-enabling constraints, the system calls `glsync_master_cleanup()` which:

```sql
-- Fix missing estimate references
INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
SELECT DISTINCT el.rowid_estimates, now(), now()
FROM public.gl_estimate_lines el
LEFT JOIN public.gl_estimates e ON el.rowid_estimates = e.glide_row_id
WHERE el.rowid_estimates IS NOT NULL
  AND e.glide_row_id IS NULL;

-- Fix missing product references
INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
SELECT DISTINCT el.rowid_products, now(), now()
FROM public.gl_estimate_lines el
LEFT JOIN public.gl_products p ON el.rowid_products = p.glide_row_id
WHERE el.rowid_products IS NOT NULL
  AND p.glide_row_id IS NULL;
```

This process:
1. Creates placeholder records for missing parent entities
2. Fixes missing or invalid display names
3. Updates calculated fields like totals
4. Logs all repairs for later review

### 4. Restoring Normal Operation

Finally, the system restores normal database operation:

```sql
-- Clear the session variable
SET LOCAL "app.glsync_mode" = 'false';

-- Re-enable all triggers and constraints
SET session_replication_role = 'origin';
```

## Benefits of This Approach

1. **Resilience**: Sync operations always succeed, even with problematic data
2. **Data Integrity**: The system automatically repairs inconsistencies
3. **Transparency**: All repairs are logged for later review
4. **Efficiency**: No need for complex validation before sync

## Example Scenarios

### Scenario 1: Missing Parent Record

1. Glide sends an estimate line referencing `rowid_estimates = "EST123"` but no estimate with `glide_row_id = "EST123"` exists
2. During override mode, the system accepts this inconsistent reference
3. During cleanup, the system creates a placeholder estimate with `glide_row_id = "EST123"`
4. The relationship is now valid

### Scenario 2: Inconsistent Display Names

1. Glide sends an estimate line with `rowid_products = "PROD456"` but no `sale_product_name`
2. During override mode, the system accepts this incomplete data
3. During cleanup, the system sets `display_name` based on product data or a fallback value
4. The UI now shows meaningful product names

## Best Practices

1. **Regular Data Cleanup**: Periodically review and clean up placeholder records
2. **Monitor Sync Logs**: Check for patterns of inconsistent data that might indicate issues in Glide
3. **Data Validation**: Implement validation in the Glide app to prevent inconsistencies where possible

## Conclusion

The "Complete Override Mode" approach ensures that sync operations always succeed while maintaining data integrity through automatic repair mechanisms. This balance of flexibility and control makes the Glidebase sync system resilient to real-world data challenges.
