# Glidebase Sync Architecture

## Overview

The Glidebase Sync system provides bidirectional synchronization between Glide Apps and Supabase PostgreSQL database. It follows a standardized architecture pattern to ensure data integrity while allowing flexible relationships between tables.

## Key Components

### 1. Edge Function (`/supabase/functions/glsync`)

The edge function serves as the API endpoint that handles sync requests from Glide Apps. It:

- Authenticates requests using API keys
- Fetches data from Glide's API
- Transforms the data to match Supabase schema
- Uses a standardized upsert approach for all tables
- Handles error logging and reporting

### 2. Database Tables

All tables follow the Glidebase pattern:
- Primary key: `id` (UUID)
- Glide identifier: `glide_row_id` (TEXT)
- Relationship fields: `rowid_[table_name]` (TEXT) referencing `glide_row_id` of related tables
- Timestamps: `created_at`, `updated_at`

### 3. Database Triggers

The system relies on database triggers to maintain data integrity:
- `set_estimate_line_display_name_trigger`: Sets display names based on product information
- `update_estimate_totals_trigger`: Updates totals in the parent estimates table
- `handle_estimate_line_changes`: Manages related data when estimate lines change

### 4. Views

The system uses views to simplify data access:
- `v_estimate_lines_with_products`: Joins estimate lines with product data
- `v_estimate_customer_details`: Provides customer information for estimates

## Data Flow

1. Client initiates sync via UI
2. Edge function receives request with mapping ID
3. Edge function fetches data from Glide API
4. Data is transformed to match Supabase schema
5. **Standard Upsert**: All tables use the same upsert method with consistent configuration
   ```typescript
   const { error } = await supabase
     .from(mapping.supabase_table)
     .upsert(batch, { 
       onConflict: 'glide_row_id',
       ignoreDuplicates: false
     });
   ```
6. Database triggers automatically handle relationships and calculated fields
7. Results and errors are logged and returned to client

## Handling Inconsistent Data

The Glidebase sync system is designed to handle inconsistent data from Glide:

1. **Standard Approach**: All tables use the same sync methodology
2. **Automatic Triggers**: Database triggers handle relationships and calculated fields
3. **Logging**: The system logs all errors for later review

This approach ensures that sync operations are consistent across all tables, including estimate lines.

## Relationship Handling

The Glidebase system uses a specific pattern for relationships:

- No actual foreign key constraints in PostgreSQL
- Relationships are maintained through `rowid_` fields
- Database triggers handle relationship integrity
- Indexes on relationship fields optimize performance
