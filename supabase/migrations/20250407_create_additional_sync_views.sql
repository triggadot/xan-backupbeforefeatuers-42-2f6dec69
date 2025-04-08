-- Migration: 20250407_create_additional_sync_views.sql
-- Purpose: Create additional views for sync monitoring and statistics
-- Date: 2025-04-07
-- Author: AI Assistant

-- Create or replace the gl_recent_logs view
CREATE OR REPLACE VIEW public.gl_recent_logs AS
SELECT 
    l.id,
    l.status,
    l.message,
    l.records_processed,
    l.started_at,
    l.completed_at,
    m.glide_table,
    m.glide_table_display_name,
    m.supabase_table,
    c.app_name,
    m.sync_direction
FROM 
    gl_sync_logs l
JOIN 
    gl_mappings m ON l.mapping_id = m.id
LEFT JOIN 
    gl_connections c ON m.connection_id = c.id
ORDER BY 
    l.started_at DESC
LIMIT 100;

-- Add comment to the gl_recent_logs view
COMMENT ON VIEW public.gl_recent_logs IS 'Recent sync logs with related mapping and connection information';

-- Create or replace the gl_sync_stats view
CREATE OR REPLACE VIEW public.gl_sync_stats AS
WITH daily_stats AS (
    SELECT 
        DATE_TRUNC('day', l.started_at)::date AS sync_date,
        COUNT(*) AS syncs,
        COUNT(CASE WHEN l.status = 'completed' THEN 1 END) AS successful_syncs,
        COUNT(CASE WHEN l.status = 'error' THEN 1 END) AS failed_syncs,
        COALESCE(SUM(l.records_processed), 0) AS total_records_processed
    FROM 
        gl_sync_logs l
    GROUP BY 
        DATE_TRUNC('day', l.started_at)::date
)
SELECT 
    sync_date,
    syncs,
    successful_syncs,
    failed_syncs,
    total_records_processed
FROM 
    daily_stats
ORDER BY 
    sync_date DESC
LIMIT 30;

-- Add comment to the gl_sync_stats view
COMMENT ON VIEW public.gl_sync_stats IS 'Daily aggregated sync statistics';

-- Grant permissions
GRANT SELECT ON public.gl_recent_logs TO authenticated;
GRANT SELECT ON public.gl_sync_stats TO authenticated;

-- Add a notice about the new views
DO $$
BEGIN
  RAISE NOTICE 'Additional sync monitoring views have been created:';
  RAISE NOTICE '- gl_recent_logs: Recent sync logs with related mapping and connection information';
  RAISE NOTICE '- gl_sync_stats: Daily aggregated sync statistics';
END $$;
