-- Remove the foreign key constraint that's causing issues
ALTER TABLE public.gl_estimate_lines
DROP CONSTRAINT IF EXISTS gl_estimate_lines_rowid_products_fkey;

-- Also check for and remove any other foreign key constraints on rowid_ fields
-- that might be inconsistent with the Glidebase pattern
DO $$
DECLARE
    constraint_record record;
BEGIN
    FOR constraint_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE conname LIKE '%rowid_%fkey'
        AND conrelid::regclass::text LIKE 'gl_%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', 
                      constraint_record.table_name, 
                      constraint_record.conname);
        
        RAISE NOTICE 'Dropped constraint % on table %', 
                    constraint_record.conname, 
                    constraint_record.table_name;
    END LOOP;
END
$$;
