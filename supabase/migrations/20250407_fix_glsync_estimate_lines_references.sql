-- Fix references to the removed glsync_estimate_lines_complete function
-- This migration identifies and updates any database objects that might still be calling
-- the removed function, ensuring the standard sync pattern is used for all tables
-- It also removes the deprecated glsync_master_control and glsync_master_cleanup functions

DO $$
DECLARE
    func_exists BOOLEAN;
    trigger_exists BOOLEAN;
    trigger_record RECORD;
BEGIN
    -- Check for any triggers on gl_estimate_lines table that might be calling the function
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass AS table_name
        FROM pg_trigger
        WHERE tgrelid = 'public.gl_estimate_lines'::regclass
    LOOP
        RAISE NOTICE 'Found trigger % on table %', trigger_record.tgname, trigger_record.table_name;
        
        -- Check if the trigger function contains a reference to glsync_estimate_lines_complete
        SELECT EXISTS (
            SELECT 1
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE t.tgname = trigger_record.tgname
            AND p.prosrc LIKE '%glsync_estimate_lines_complete%'
        ) INTO trigger_exists;
        
        IF trigger_exists THEN
            RAISE NOTICE 'Trigger % contains reference to glsync_estimate_lines_complete, dropping it', trigger_record.tgname;
            EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON ' || trigger_record.table_name;
        END IF;
    END LOOP;
    
    -- Check if there's a function called glsync_master_control and remove it
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE proname = 'glsync_master_control'
        AND pg_namespace.nspname = 'public'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Removing deprecated function glsync_master_control';
        DROP FUNCTION IF EXISTS public.glsync_master_control();
    END IF;
    
    -- Check if there's a function called glsync_master_cleanup and remove it
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE proname = 'glsync_master_cleanup'
        AND pg_namespace.nspname = 'public'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Removing deprecated function glsync_master_cleanup';
        DROP FUNCTION IF EXISTS public.glsync_master_cleanup();
    END IF;
    
    -- Check for any functions that might be calling glsync_estimate_lines_complete
    FOR trigger_record IN 
        SELECT proname, pronamespace::regnamespace AS schema_name
        FROM pg_proc
        WHERE prosrc LIKE '%glsync_estimate_lines_complete%'
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Function % in schema % contains reference to glsync_estimate_lines_complete', 
            trigger_record.proname, trigger_record.schema_name;
            
        -- We don't automatically modify these functions as they might need custom handling
        -- Just log them for manual review
    END LOOP;
    
    -- Check for any functions that might be calling glsync_master_control
    FOR trigger_record IN 
        SELECT proname, pronamespace::regnamespace AS schema_name
        FROM pg_proc
        WHERE prosrc LIKE '%glsync_master_control%'
        AND proname != 'glsync_master_control'
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Function % in schema % contains reference to glsync_master_control', 
            trigger_record.proname, trigger_record.schema_name;
            
        -- We don't automatically modify these functions as they might need custom handling
        -- Just log them for manual review
    END LOOP;
    
    -- Check for any functions that might be calling glsync_master_cleanup
    FOR trigger_record IN 
        SELECT proname, pronamespace::regnamespace AS schema_name
        FROM pg_proc
        WHERE prosrc LIKE '%glsync_master_cleanup%'
        AND proname != 'glsync_master_cleanup'
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Function % in schema % contains reference to glsync_master_cleanup', 
            trigger_record.proname, trigger_record.schema_name;
            
        -- We don't automatically modify these functions as they might need custom handling
        -- Just log them for manual review
    END LOOP;
    
    -- Reset session replication role to be safe
    SET session_replication_role = 'origin';
    
    RAISE NOTICE 'Migration completed successfully';
END
$$;

-- Add documentation for the changes
COMMENT ON DATABASE postgres IS 'The Glidebase system uses a standard upsert pattern for all tables including gl_estimate_lines. No special handling or functions like glsync_estimate_lines_complete, glsync_master_control, or glsync_master_cleanup should be used.';
