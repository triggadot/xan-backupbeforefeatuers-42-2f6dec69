# Telegram Product Matching: Database Layer

## Schema Overview

The product matching system extends the existing database with several new tables and types:

### Enum Types

```sql
-- Match type classification
CREATE TYPE match_type AS ENUM (
    'exact',       -- Exact match on key fields
    'fuzzy',       -- Partial or fuzzy match on names
    'manual',      -- Manually matched by a user
    'auto'         -- Automatically matched by system
);

-- Approval status for queue items
CREATE TYPE approval_status AS ENUM (
    'pending',     -- Awaiting approval
    'approved',    -- Approved and product created/linked
    'rejected',    -- Rejected, no product created
    'auto_matched' -- Automatically matched and approved
);

-- Confidence level for matches
CREATE TYPE confidence_level AS ENUM (
    'high',      -- Auto match (90-100)
    'medium',    -- Send to n8n (70-89)
    'low'        -- Manual review (0-69)
);
```

### Table Extensions

```sql
-- Added fields to messages table
ALTER TABLE messages
    ADD COLUMN product_match_status TEXT,
    ADD COLUMN product_match_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN product_match_confidence NUMERIC,
    ADD COLUMN match_type match_type;
```

### New Tables

#### Product Approval Queue

```sql
CREATE TABLE product_approval_queue (
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
```

#### Matching Configuration

```sql
CREATE TABLE product_matching_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB DEFAULT jsonb_build_object(
        'auto_match_threshold', 80,
        'date_window_days', 4,
        'consider_purchase_order_uid', true,
        'consider_vendor_name', true,
        'consider_product_name', true,
        'product_name_fields', jsonb_build_array('vendor_product_name', 'new_product_name', 'display_name'),
        'field_weights', jsonb_build_object(
            'vendor_uid', 30,
            'purchase_date', 30,
            'product_name', 40,
            'purchase_order_uid', 50
        ),
        'use_ai_assistance', false,
        'high_confidence_threshold', 90.0,
        'medium_confidence_threshold', 70.0,
        'webhook_id', NULL
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Webhook Configuration

```sql
CREATE TABLE webhook_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    endpoint_url TEXT NOT NULL,
    auth_token TEXT,
    headers JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    event_types TEXT[] DEFAULT '{"product_matching"}',
    description TEXT,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Database Functions

### Core Matching Functions

#### `get_potential_product_matches`

Finds and scores potential product matches for a Telegram message.

**Parameters:**
- `p_message_id UUID`: Message ID to find matches for
- `p_limit INTEGER DEFAULT 10`: Maximum number of matches to return
- `p_min_score NUMERIC DEFAULT 0`: Minimum score threshold for matches

**Returns:** JSONB containing potential matches with scores and match reasons

**Match Criteria:**
- Vendor matching (comparing vendor_uid to account names)
- Purchase date proximity (within configured date window)
- Product name similarity (across multiple product name fields)
- Purchase order matching

**Example Usage:**
```sql
SELECT * FROM get_potential_product_matches('00000000-0000-0000-0000-000000000000', 5, 60);
```

#### `match_message_to_products`

Processes a message for product matching based on confidence levels.

**Parameters:**
- `p_message_id UUID`: Message ID to process
- `p_confidence_override JSONB DEFAULT NULL`: Optional override for confidence settings

**Returns:** JSONB with match results and actions taken

**Behavior:**
- For high confidence matches (90%+): Automatically links media to product
- For medium confidence (70-89%): If AI is enabled, sends to n8n for evaluation
- For low confidence (<70%): Adds to approval queue for manual review

**Example Usage:**
```sql
SELECT * FROM match_message_to_products('00000000-0000-0000-0000-000000000000');
```

#### `send_product_matching_webhook`

Sends product matching data to n8n for AI evaluation.

**Parameters:**
- `p_message_id UUID`: Message ID to send
- `p_match_data JSONB`: Matching data to include
- `p_confidence_level confidence_level`: Confidence level classification

**Returns:** JSONB with webhook send status

### Approval Queue Management

#### `get_product_approval_queue`

Retrieves items from the product approval queue with filtering.

**Parameters:**
- `p_status approval_status DEFAULT 'pending'`: Status to filter by
- `p_limit INTEGER DEFAULT 20`: Max number to return
- `p_offset INTEGER DEFAULT 0`: Pagination offset

**Returns:** JSONB with queue items and pagination info

#### `approve_product_from_queue`

Approves a product match in the queue.

**Parameters:**
- `p_queue_id UUID`: Queue item ID
- `p_product_id VARCHAR`: Product ID to link
- `p_user_id UUID DEFAULT auth.uid()`: User performing the approval

**Returns:** JSONB with approval status

#### `reject_product_from_queue`

Rejects a product match in the queue.

**Parameters:**
- `p_queue_id UUID`: Queue item ID
- `p_reason TEXT DEFAULT NULL`: Optional rejection reason
- `p_user_id UUID DEFAULT auth.uid()`: User performing the rejection

**Returns:** JSONB with rejection status

#### `process_ai_matching_result`

Processes AI matching results returned from n8n.

**Parameters:**
- `p_queue_id UUID`: Queue item ID
- `p_action TEXT`: Action to take ('auto_match', 'create_product', 'manual_review')
- `p_product_id TEXT DEFAULT NULL`: Product ID for matching
- `p_confidence_score NUMERIC DEFAULT NULL`: Confidence score from AI
- `p_ai_reasoning TEXT DEFAULT NULL`: AI reasoning for the decision

**Returns:** JSONB with processing results

## Row-Level Security Policies

The product approval queue has the following RLS policies:

```sql
ALTER TABLE product_approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product approval queue is viewable by authenticated users" 
    ON product_approval_queue FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Product approval queue is editable by authenticated users" 
    ON product_approval_queue FOR UPDATE 
    USING (auth.role() = 'authenticated');
```

## Indexes

The following indexes improve query performance:

```sql
CREATE INDEX idx_approval_queue_status 
    ON product_approval_queue(status);

CREATE INDEX idx_approval_queue_message_id 
    ON product_approval_queue(message_id);

CREATE INDEX idx_approval_queue_purchase_order 
    ON product_approval_queue(suggested_purchase_order_uid);

CREATE INDEX idx_approval_queue_vendor 
    ON product_approval_queue(suggested_vendor_uid);

CREATE INDEX idx_approval_queue_product_name 
    ON product_approval_queue(suggested_product_name);

CREATE INDEX idx_messages_glide_row_id 
    ON messages(glide_row_id) 
    WHERE glide_row_id IS NOT NULL;

CREATE INDEX idx_messages_product_match_status 
    ON messages(product_match_status) 
    WHERE product_match_status IS NOT NULL;
```
