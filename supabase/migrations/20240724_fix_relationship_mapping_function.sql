
-- Function to map relationships between tables in the Glide sync system
CREATE OR REPLACE FUNCTION glsync_map_relationships(p_table_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := jsonb_build_object('mapped_count', 0, 'tables', '{}'::jsonb);
  v_mapped_count INTEGER := 0;
  v_column_record RECORD;
  v_rel_column TEXT;
  v_target_table TEXT;
  v_source_count INTEGER;
  v_mapped_count_per_table JSONB := '{}'::JSONB;
  v_id_type TEXT;
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = p_table_name) THEN
    RAISE EXCEPTION 'Table % does not exist', p_table_name;
  END IF;
  
  -- Get all columns that appear to be relationship columns (rowid_ or sb_)
  FOR v_column_record IN 
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = p_table_name
      AND (column_name LIKE 'rowid_%' OR column_name LIKE 'sb_%')
  LOOP
    -- Determine target table from column name
    IF v_column_record.column_name LIKE 'rowid_%' THEN
      v_target_table := 'gl_' || substring(v_column_record.column_name FROM 7);
      v_rel_column := 'sb_' || substring(v_column_record.column_name FROM 7) || '_id';
      
      -- Handle special cases for plural target tables
      IF substring(v_column_record.column_name FROM 7) = 'accounts' THEN
        v_rel_column := 'sb_accounts_id';
      ELSIF substring(v_column_record.column_name FROM 7) = 'products' THEN
        v_rel_column := 'sb_products_id';
      ELSIF substring(v_column_record.column_name FROM 7) = 'invoices' THEN
        v_rel_column := 'sb_invoices_id';
      ELSIF substring(v_column_record.column_name FROM 7) = 'purchase_orders' THEN
        v_rel_column := 'sb_purchase_orders_id';
      ELSIF substring(v_column_record.column_name FROM 7) = 'estimates' THEN
        v_rel_column := 'sb_estimates_id';
      END IF;
    ELSE
      CONTINUE; -- Skip sb_ columns as we're updating them based on rowid_
    END IF;
    
    -- Make sure target table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = v_target_table) THEN
      RAISE NOTICE 'Target table % does not exist, skipping column %', v_target_table, v_column_record.column_name;
      CONTINUE;
    END IF;
    
    -- Determine ID column type in target table
    SELECT data_type INTO v_id_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = v_target_table
      AND column_name = 'id';
      
    IF v_id_type IS NULL THEN
      RAISE NOTICE 'Target table % does not have id column, skipping', v_target_table;
      CONTINUE;
    END IF;
    
    -- Check if the target column (sb_column) exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = p_table_name
        AND column_name = v_rel_column
    ) THEN
      RAISE NOTICE 'Target column % does not exist in table %, skipping', v_rel_column, p_table_name;
      CONTINUE;
    END IF;
    
    -- Update the sb_ column with the corresponding id from the target table
    EXECUTE format('
      WITH updated_rows AS (
        UPDATE %I 
        SET %I = target_table.id 
        FROM %I target_table 
        WHERE %I.%I = target_table.glide_row_id 
          AND %I.%I IS NOT NULL
          AND target_table.glide_row_id IS NOT NULL
        RETURNING 1
      )
      SELECT COUNT(*) FROM updated_rows
    ', p_table_name, v_rel_column, v_target_table, p_table_name, v_column_record.column_name, p_table_name, v_column_record.column_name)
    INTO v_source_count;
    
    -- Add to mapped count
    v_mapped_count := v_mapped_count + v_source_count;
    v_mapped_count_per_table := v_mapped_count_per_table || jsonb_build_object(v_target_table, v_source_count);
    
    RAISE NOTICE 'Mapped % relationships from %.% to %.id', v_source_count, p_table_name, v_column_record.column_name, v_target_table;
  END LOOP;

  -- Return results as JSON
  v_result := jsonb_build_object(
    'mapped_count', v_mapped_count,
    'table', p_table_name,
    'details', v_mapped_count_per_table
  );
  
  RETURN v_result;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION glsync_map_relationships(TEXT) IS 'Maps relationships between tables based on rowid_ columns and sb_ columns';

-- Function to bulk update all relationships across all gl_ tables
CREATE OR REPLACE FUNCTION glsync_map_all_relationships()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table RECORD;
  v_result JSONB := '{}'::JSONB;
  v_table_result JSONB;
  v_total_mapped INTEGER := 0;
  v_tables_processed JSONB := '{}'::JSONB;
BEGIN
  FOR v_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename LIKE 'gl_%'
      AND tablename NOT IN ('gl_connections', 'gl_mappings', 'gl_sync_logs', 'gl_sync_errors')
  LOOP
    BEGIN
      v_table_result := glsync_map_relationships(v_table.tablename);
      v_result := v_result || jsonb_build_object(v_table.tablename, v_table_result);
      v_total_mapped := v_total_mapped + (v_table_result->>'mapped_count')::INTEGER;
      
      -- Add to tables processed if we have a mapped count
      IF (v_table_result->>'mapped_count')::INTEGER > 0 THEN
        v_tables_processed := v_tables_processed || jsonb_build_object(v_table.tablename, (v_table_result->>'mapped_count')::INTEGER);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error mapping relationships for table %: %', v_table.tablename, SQLERRM;
      v_result := v_result || jsonb_build_object(v_table.tablename, jsonb_build_object('error', SQLERRM));
    END;
  END LOOP;
  
  -- Return with summary
  RETURN jsonb_build_object(
    'total_mapped', v_total_mapped,
    'tables_processed', v_tables_processed,
    'details', v_result
  );
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION glsync_map_all_relationships() IS 'Maps relationships between all gl_ tables based on rowid_ and sb_ columns';

-- Function to map relationships for a single record (for triggers)
CREATE OR REPLACE FUNCTION glsync_map_record_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_column_record RECORD;
  v_rel_column TEXT;
  v_target_table TEXT;
  v_target_id UUID;
  v_rowid_value TEXT;
BEGIN
  -- For each rowid_ column, update the corresponding sb_ column
  FOR v_column_record IN 
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = TG_TABLE_NAME
      AND column_name LIKE 'rowid_%'
  LOOP
    -- Get the rowid value using dynamic SQL
    EXECUTE format('SELECT $1.%I', v_column_record.column_name)
    USING NEW INTO v_rowid_value;
    
    -- Skip if the rowid_ value is NULL
    IF v_rowid_value IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Determine target table and sb_ column
    v_target_table := 'gl_' || substring(v_column_record.column_name FROM 7);
    v_rel_column := 'sb_' || substring(v_column_record.column_name FROM 7) || '_id';
    
    -- Handle special cases for plural target tables
    IF substring(v_column_record.column_name FROM 7) = 'accounts' THEN
      v_rel_column := 'sb_accounts_id';
    ELSIF substring(v_column_record.column_name FROM 7) = 'products' THEN
      v_rel_column := 'sb_products_id';
    ELSIF substring(v_column_record.column_name FROM 7) = 'invoices' THEN
      v_rel_column := 'sb_invoices_id';
    ELSIF substring(v_column_record.column_name FROM 7) = 'purchase_orders' THEN
      v_rel_column := 'sb_purchase_orders_id';
    ELSIF substring(v_column_record.column_name FROM 7) = 'estimates' THEN
      v_rel_column := 'sb_estimates_id';
    END IF;
    
    -- Check if the target column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = TG_TABLE_NAME
        AND column_name = v_rel_column
    ) THEN
      CONTINUE;
    END IF;
    
    -- Look up the UUID from the target table based on glide_row_id
    EXECUTE format('
      SELECT id FROM %I WHERE glide_row_id = $1
    ', v_target_table) INTO v_target_id USING v_rowid_value;
    
    -- Update the sb_ column if we found a matching UUID
    IF v_target_id IS NOT NULL THEN
      EXECUTE format('
        UPDATE %I SET %I = $1 WHERE id = $2
      ', TG_TABLE_NAME, v_rel_column) USING v_target_id, NEW.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION glsync_map_record_relationships() IS 'Trigger function to map relationships for a single record';

-- Create a trigger on each gl_ table to map relationships on insert/update
-- This is a helper function to create the triggers
CREATE OR REPLACE FUNCTION glsync_create_relationship_triggers()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table RECORD;
  v_trigger_name TEXT;
BEGIN
  FOR v_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename LIKE 'gl_%'
      AND tablename NOT IN ('gl_connections', 'gl_mappings', 'gl_sync_logs', 'gl_sync_errors')
  LOOP
    v_trigger_name := v_table.tablename || '_glsync_rel_trigger';
    
    -- Drop existing trigger if it exists
    EXECUTE format('
      DROP TRIGGER IF EXISTS %I ON %I
    ', v_trigger_name, v_table.tablename);
    
    -- Create new trigger
    EXECUTE format('
      CREATE TRIGGER %I
      AFTER INSERT OR UPDATE
      ON %I
      FOR EACH ROW
      EXECUTE FUNCTION glsync_map_record_relationships()
    ', v_trigger_name, v_table.tablename);
    
    RAISE NOTICE 'Created trigger % on table %', v_trigger_name, v_table.tablename;
  END LOOP;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION glsync_create_relationship_triggers() IS 'Creates triggers on all gl_ tables to map relationships automatically';
