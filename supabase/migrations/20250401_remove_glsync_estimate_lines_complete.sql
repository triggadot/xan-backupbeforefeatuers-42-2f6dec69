-- Drop the glsync_estimate_lines_complete function if it exists
DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
        WHERE proname = 'glsync_estimate_lines_complete' 
        AND pg_namespace.nspname = 'public'
    ) INTO func_exists;
    
    IF func_exists THEN
        -- Drop with CASCADE to handle dependencies
        EXECUTE 'DROP FUNCTION IF EXISTS public.glsync_estimate_lines_complete(jsonb) CASCADE';
        RAISE NOTICE 'Function glsync_estimate_lines_complete has been dropped with CASCADE';
        
        -- Revoke any permissions that might be causing issues
        EXECUTE 'REVOKE ALL ON FUNCTION public.glsync_estimate_lines_complete(jsonb) FROM public';
        EXECUTE 'REVOKE ALL ON FUNCTION public.glsync_estimate_lines_complete(jsonb) FROM anon';
        EXECUTE 'REVOKE ALL ON FUNCTION public.glsync_estimate_lines_complete(jsonb) FROM authenticated';
        EXECUTE 'REVOKE ALL ON FUNCTION public.glsync_estimate_lines_complete(jsonb) FROM service_role';
    ELSE
        RAISE NOTICE 'Function glsync_estimate_lines_complete does not exist';
    END IF;
    
    -- Also check for any other signatures of the same function
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
        WHERE proname = 'glsync_estimate_lines_complete' 
        AND pg_namespace.nspname = 'public'
    ) INTO func_exists;
    
    IF func_exists THEN
        -- Drop any other signatures with CASCADE
        EXECUTE 'DROP FUNCTION IF EXISTS public.glsync_estimate_lines_complete CASCADE';
        RAISE NOTICE 'Additional signatures of glsync_estimate_lines_complete have been dropped with CASCADE';
    END IF;
END
$$;
