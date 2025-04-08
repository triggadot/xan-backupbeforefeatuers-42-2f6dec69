-- Migration: 20250407_add_session_replication_helpers.sql
-- Purpose: Add helper functions to manage session replication role for sync operations
-- Date: 2025-04-07
-- Author: AI Assistant

-- Create function to set session replication role
CREATE OR REPLACE FUNCTION public.set_session_replication_role(role text)
RETURNS void AS $$
BEGIN
  -- Validate input to prevent SQL injection
  IF role NOT IN ('origin', 'replica', 'local') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: origin, replica, local', role;
  END IF;
  
  -- Set the session replication role
  EXECUTE 'SET session_replication_role = ' || quote_literal(role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_session_replication_role(text) IS 'Safely sets the session_replication_role to temporarily disable triggers during operations like sync';

-- Create function to reset session replication role to default (origin)
CREATE OR REPLACE FUNCTION public.reset_session_replication_role()
RETURNS void AS $$
BEGIN
  SET session_replication_role = 'origin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_session_replication_role() IS 'Resets the session_replication_role back to origin to re-enable triggers after operations like sync';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.set_session_replication_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_session_replication_role() TO authenticated;

-- Add a notice about the new functions
DO $$
BEGIN
  RAISE NOTICE 'Session replication role helper functions have been created.';
  RAISE NOTICE 'These functions will be used by the sync process to temporarily disable triggers during data operations.';
END $$;
