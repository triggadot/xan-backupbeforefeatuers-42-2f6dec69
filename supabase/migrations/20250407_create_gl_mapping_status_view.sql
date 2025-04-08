-- Migration: 20250407_create_gl_mapping_status_view.sql
-- Purpose: Create the gl_mapping_status view for sync status information
-- Date: 2025-04-07
-- Author: AI Assistant

-- Create or replace the gl_mapping_status view
CREATE OR REPLACE VIEW public.gl_mapping_status AS
SELECT 
    m.id AS mapping_id,
    m.connection_id,
    m.glide_table,
    m.supabase_table,
    c.app_name,
    m.glide_table_display_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM gl_sync_logs l 
            WHERE l.mapping_id = m.id 
            AND l.status = 'processing'
            AND l.completed_at IS NULL
        ) THEN 'processing'
        WHEN EXISTS (
            SELECT 1 FROM gl_sync_errors e 
            WHERE e.mapping_id = m.id 
            AND e.resolved_at IS NULL
            LIMIT 1
        ) THEN 'error'
        ELSE 'ready'
    END AS current_status,
    m.enabled,
    (
        SELECT COUNT(*) 
        FROM gl_sync_errors e 
        WHERE e.mapping_id = m.id 
        AND e.resolved_at IS NULL
    ) AS error_count,
    COALESCE(
        (
            SELECT SUM(l.records_processed) 
            FROM gl_sync_logs l 
            WHERE l.mapping_id = m.id 
            AND l.status = 'completed'
        ), 0
    ) AS records_processed,
    COALESCE(
        (
            SELECT COUNT(*) 
            FROM gl_sync_logs l 
            WHERE l.mapping_id = m.id
        ), 0
    ) AS total_syncs,
    m.sync_direction,
    (
        SELECT MAX(l.started_at) 
        FROM gl_sync_logs l 
        WHERE l.mapping_id = m.id
    ) AS last_sync_started_at,
    (
        SELECT MAX(l.completed_at) 
        FROM gl_sync_logs l 
        WHERE l.mapping_id = m.id 
        AND l.status = 'completed'
    ) AS last_sync_completed_at
FROM 
    gl_mappings m
LEFT JOIN 
    gl_connections c ON m.connection_id = c.id;

-- Add comment to the view
COMMENT ON VIEW public.gl_mapping_status IS 'Real-time view aggregating sync status information for each mapping';

-- Grant permissions
GRANT SELECT ON public.gl_mapping_status TO authenticated;

-- Add a notice about the new view
DO $$
BEGIN
  RAISE NOTICE 'The gl_mapping_status view has been created.';
  RAISE NOTICE 'This view provides real-time status information for all mappings.';
END $$;
