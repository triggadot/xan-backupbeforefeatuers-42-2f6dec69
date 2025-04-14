-- Migration: 20250412_telegram_product_matching.sql
-- Description: Creates the product approval queue table and related schema for
-- automatically matching Telegram media messages with products.

-- Check if processing_state type needs new values
DO $$
BEGIN
    -- Add 'product_matched' state if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type 
                  WHERE typname = 'processing_state' 
                  AND typarray = 'processing_state[]'::regtype::oid
                  AND 'product_matched' = ANY(enum_range(NULL::processing_state))) THEN
        ALTER TYPE processing_state ADD VALUE 'product_matched' AFTER 'completed';
    END IF;
    
    -- Add 'awaiting_product_approval' state if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type 
                  WHERE typname = 'processing_state' 
                  AND typarray = 'processing_state[]'::regtype::oid 
                  AND 'awaiting_product_approval' = ANY(enum_range(NULL::processing_state))) THEN
        ALTER TYPE processing_state ADD VALUE 'awaiting_product_approval' AFTER 'product_matched';
    END IF;
END
$$;

-- Create match_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_type') THEN
        CREATE TYPE match_type AS ENUM (
            'exact',       -- Exact match on key fields
            'fuzzy',       -- Partial or fuzzy match on names
            'manual',      -- Manually matched by a user
            'auto'         -- Automatically matched by system
        );
    END IF;
END
$$;

-- Create approval_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM (
            'pending',     -- Awaiting approval
            'approved',    -- Approved and product created/linked
            'rejected',    -- Rejected, no product created
            'auto_matched' -- Automatically matched and approved
        );
    END IF;
END
$$;

-- Add product matching fields to messages table if they don't exist
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS product_match_status TEXT,
    ADD COLUMN IF NOT EXISTS product_match_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS product_match_confidence NUMERIC,
    ADD COLUMN IF NOT EXISTS match_type match_type;

-- Create product_approval_queue table
CREATE TABLE IF NOT EXISTS product_approval_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id),
    status approval_status NOT NULL DEFAULT 'pending',
    caption_data JSONB,
    analyzed_content JSONB,
    suggested_product_name TEXT,
    suggested_vendor_uid TEXT,
    suggested_purchase_date DATE,
    suggested_purchase_order_uid TEXT,
    best_match_product_id TEXT,
    best_match_score NUMERIC,
    best_match_reasons JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Create product_matching_config table
CREATE TABLE IF NOT EXISTS product_matching_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    auto_match_threshold NUMERIC DEFAULT 80, -- Minimum confidence score for auto-matching
    date_window_days INTEGER DEFAULT 4,      -- Days to look before/after purchase date
    consider_purchase_order_uid BOOLEAN DEFAULT true,
    consider_vendor_name BOOLEAN DEFAULT true,
    consider_product_name BOOLEAN DEFAULT true,
    product_name_fields JSONB DEFAULT '["vendor_product_name", "new_product_name", "display_name"]',
    field_weights JSONB DEFAULT '{"vendor_uid": 30, "purchase_date": 30, "product_name": 40, "purchase_order_uid": 50}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default configuration if it doesn't exist
INSERT INTO product_matching_config (name)
SELECT 'default'
WHERE NOT EXISTS (SELECT 1 FROM product_matching_config WHERE name = 'default');

-- Create archive table for old approval records
CREATE TABLE IF NOT EXISTS product_approval_queue_archive (
    LIKE product_approval_queue INCLUDING ALL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_approval_queue_status 
    ON product_approval_queue(status);

CREATE INDEX IF NOT EXISTS idx_approval_queue_message_id 
    ON product_approval_queue(message_id);

CREATE INDEX IF NOT EXISTS idx_approval_queue_purchase_order 
    ON product_approval_queue(suggested_purchase_order_uid);

CREATE INDEX IF NOT EXISTS idx_approval_queue_vendor 
    ON product_approval_queue(suggested_vendor_uid);

CREATE INDEX IF NOT EXISTS idx_approval_queue_product_name 
    ON product_approval_queue(suggested_product_name);

CREATE INDEX IF NOT EXISTS idx_messages_glide_row_id 
    ON messages(glide_row_id) 
    WHERE glide_row_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_product_match_status 
    ON messages(product_match_status) 
    WHERE product_match_status IS NOT NULL;

-- Add RLS policies for product_approval_queue
ALTER TABLE product_approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product approval queue is viewable by authenticated users" 
    ON product_approval_queue FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Product approval queue is editable by authenticated users" 
    ON product_approval_queue FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Create function to get product matches for a message
CREATE OR REPLACE FUNCTION get_potential_product_matches(
    p_message_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_min_score NUMERIC DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_message RECORD;
    v_caption_data JSONB;
    v_config RECORD;
BEGIN
    -- Get message data
    SELECT id, caption, caption_data, analyzed_content
    INTO v_message
    FROM messages
    WHERE id = p_message_id;
    
    IF v_message IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message not found');
    END IF;
    
    -- Get matching configuration
    SELECT * INTO v_config
    FROM product_matching_config
    WHERE name = 'default' AND active = true;
    
    -- Use analyzed_content or caption_data, whichever is available
    v_caption_data := COALESCE(v_message.analyzed_content, v_message.caption_data);
    
    IF v_caption_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No caption data available');
    END IF;
    
    -- Query for potential matches
    WITH potential_matches AS (
        SELECT 
            p.id,
            p.glide_row_id,
            p.vendor_product_name,
            p.new_product_name,
            p.display_name,
            p.product_purchase_date,
            CASE 
                -- Vendor matching weight
                WHEN v_config.consider_vendor_name AND
                     p.rowid_accounts IS NOT NULL AND
                     v_caption_data->>'vendor_uid' IS NOT NULL AND
                     EXISTS (
                       SELECT 1 FROM gl_accounts a 
                       WHERE a.glide_row_id = p.rowid_accounts
                       AND a.account_name ILIKE '%' || (v_caption_data->>'vendor_uid') || '%'
                     )
                THEN (v_config.field_weights->>'vendor_uid')::NUMERIC
                ELSE 0
            END +
            -- Purchase date proximity weight
            CASE
                WHEN v_caption_data->>'purchase_date' IS NOT NULL AND 
                     p.product_purchase_date IS NOT NULL
                THEN
                  CASE
                    -- Exact date match
                    WHEN p.product_purchase_date = (v_caption_data->>'purchase_date')::DATE
                    THEN (v_config.field_weights->>'purchase_date')::NUMERIC
                    -- Date within window
                    WHEN ABS(p.product_purchase_date - (v_caption_data->>'purchase_date')::DATE) <= v_config.date_window_days
                    THEN ((v_config.field_weights->>'purchase_date')::NUMERIC * 
                         (1 - (ABS(p.product_purchase_date - (v_caption_data->>'purchase_date')::DATE)::NUMERIC / v_config.date_window_days)))
                    ELSE 0
                  END
                ELSE 0
            END +
            -- Product name similarity weight
            CASE 
                WHEN v_config.consider_product_name AND
                     v_caption_data->>'product_name' IS NOT NULL
                THEN
                  GREATEST(
                    -- Check vendor_product_name
                    CASE WHEN p.vendor_product_name ILIKE '%' || (v_caption_data->>'product_name') || '%' 
                         THEN (v_config.field_weights->>'product_name')::NUMERIC ELSE 0 END,
                    -- Check new_product_name 
                    CASE WHEN p.new_product_name ILIKE '%' || (v_caption_data->>'product_name') || '%' 
                         THEN (v_config.field_weights->>'product_name')::NUMERIC ELSE 0 END,
                    -- Check display_name
                    CASE WHEN p.display_name ILIKE '%' || (v_caption_data->>'product_name') || '%' 
                         THEN (v_config.field_weights->>'product_name')::NUMERIC ELSE 0 END
                  )
                ELSE 0
            END +
            -- Purchase Order UID match weight
            CASE
                WHEN v_config.consider_purchase_order_uid AND
                     v_caption_data->>'purchase_order_uid' IS NOT NULL AND
                     EXISTS (
                       SELECT 1 FROM gl_purchase_orders po
                       WHERE po.glide_row_id = p.rowid_purchase_orders
                       AND po.po_uid = v_caption_data->>'purchase_order_uid'
                     )
                THEN (v_config.field_weights->>'purchase_order_uid')::NUMERIC
                ELSE 0
            END AS match_score,
            
            -- Collect match reasons for transparency
            json_build_object(
                'vendor_matched', 
                (v_config.consider_vendor_name AND
                 p.rowid_accounts IS NOT NULL AND
                 v_caption_data->>'vendor_uid' IS NOT NULL AND
                 EXISTS (
                   SELECT 1 FROM gl_accounts a 
                   WHERE a.glide_row_id = p.rowid_accounts
                   AND a.account_name ILIKE '%' || (v_caption_data->>'vendor_uid') || '%'
                 )),
                'purchase_date_match',
                CASE 
                    WHEN v_caption_data->>'purchase_date' IS NOT NULL AND p.product_purchase_date IS NOT NULL
                    THEN 
                        CASE 
                            WHEN p.product_purchase_date = (v_caption_data->>'purchase_date')::DATE
                            THEN 'exact'
                            WHEN ABS(p.product_purchase_date - (v_caption_data->>'purchase_date')::DATE) <= v_config.date_window_days
                            THEN ABS(p.product_purchase_date - (v_caption_data->>'purchase_date')::DATE) || ' days difference'
                            ELSE NULL
                        END
                    ELSE NULL
                END,
                'product_name_match',
                CASE 
                    WHEN v_config.consider_product_name AND v_caption_data->>'product_name' IS NOT NULL
                    THEN 
                        CASE 
                            WHEN p.vendor_product_name ILIKE '%' || (v_caption_data->>'product_name') || '%'
                            THEN 'vendor_product_name'
                            WHEN p.new_product_name ILIKE '%' || (v_caption_data->>'product_name') || '%'
                            THEN 'new_product_name'
                            WHEN p.display_name ILIKE '%' || (v_caption_data->>'product_name') || '%'
                            THEN 'display_name'
                            ELSE NULL
                        END
                    ELSE NULL
                END,
                'purchase_order_match',
                (v_config.consider_purchase_order_uid AND
                 v_caption_data->>'purchase_order_uid' IS NOT NULL AND
                 EXISTS (
                   SELECT 1 FROM gl_purchase_orders po
                   WHERE po.glide_row_id = p.rowid_purchase_orders
                   AND po.po_uid = v_caption_data->>'purchase_order_uid'
                 ))
            ) AS match_reasons
        FROM gl_products p
        WHERE 
            -- Only include potential matches based on core criteria
            (
                -- Vendor match
                (v_config.consider_vendor_name AND
                 v_caption_data->>'vendor_uid' IS NOT NULL AND
                 EXISTS (
                   SELECT 1 FROM gl_accounts a 
                   WHERE a.glide_row_id = p.rowid_accounts
                   AND a.account_name ILIKE '%' || (v_caption_data->>'vendor_uid') || '%'
                ))
                OR
                -- Date proximity match
                (v_caption_data->>'purchase_date' IS NOT NULL AND 
                 p.product_purchase_date IS NOT NULL AND
                 ABS(p.product_purchase_date - (v_caption_data->>'purchase_date')::DATE) <= v_config.date_window_days)
                OR
                -- Product name similarity match
                (v_config.consider_product_name AND
                 v_caption_data->>'product_name' IS NOT NULL AND
                 (p.vendor_product_name ILIKE '%' || (v_caption_data->>'product_name') || '%' OR
                  p.new_product_name ILIKE '%' || (v_caption_data->>'product_name') || '%' OR
                  p.display_name ILIKE '%' || (v_caption_data->>'product_name') || '%'))
                OR
                -- Purchase order match
                (v_config.consider_purchase_order_uid AND
                 v_caption_data->>'purchase_order_uid' IS NOT NULL AND
                 EXISTS (
                   SELECT 1 FROM gl_purchase_orders po
                   WHERE po.glide_row_id = p.rowid_purchase_orders
                   AND po.po_uid = v_caption_data->>'purchase_order_uid'
                 ))
            )
    ),
    -- Filter to only include products with positive scores, sort by score
    scored_matches AS (
        SELECT *
        FROM potential_matches
        WHERE match_score >= p_min_score
        ORDER BY match_score DESC
        LIMIT p_limit
    )
    -- Build the result
    SELECT json_agg(
        json_build_object(
            'id', id,
            'glide_row_id', glide_row_id,
            'vendor_product_name', vendor_product_name,
            'new_product_name', new_product_name,
            'display_name', display_name,
            'product_purchase_date', product_purchase_date,
            'match_score', match_score,
            'match_reasons', match_reasons
        )
    ) INTO v_result
    FROM scored_matches;
    
    -- Return the results
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'matches', COALESCE(v_result, '[]'::jsonb),
        'match_count', json_array_length(COALESCE(v_result, '[]'::jsonb)),
        'caption_data', v_caption_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comment on this function
COMMENT ON FUNCTION get_potential_product_matches IS 'Get potential product matches for a telegram message based on caption data';
