# Glidebase Sync Architecture

## Overview

The Glidebase Sync system provides bidirectional synchronization between Glide Apps and Supabase PostgreSQL database. It follows a specific architecture pattern to ensure data integrity while allowing flexible relationships between tables.

## Key Components

### 1. Edge Function (`/supabase/functions/glsync`)

The edge function serves as the API endpoint that handles sync requests from Glide Apps. It:

- Authenticates requests using API keys
- Fetches data from Glide's API
- Transforms the data to match Supabase schema
- Uses specialized functions for different tables
- Handles error logging and reporting

### 2. Database Functions

The system uses several specialized PostgreSQL functions:

- `glsync_master_control()`: Completely overrides all PostgreSQL rules and constraints during sync
- `glsync_estimate_lines(data JSONB)`: Handles estimate lines sync with special relationship handling
- `glsync_master_cleanup()`: Re-enables constraints, fixes inconsistent data, and updates calculated fields

### 3. Database Tables

All tables follow the Glidebase pattern:
- Primary key: `id` (UUID)
- Glide identifier: `glide_row_id` (TEXT)
- Relationship fields: `rowid_[table_name]` (TEXT) referencing `glide_row_id` of related tables
- Timestamps: `created_at`, `updated_at`

### 4. Views

The system uses views to simplify data access:
- `v_estimate_lines_with_products`: Joins estimate lines with product data
- `v_estimate_customer_details`: Provides customer information for estimates

## Data Flow

1. Client initiates sync via UI
2. Edge function receives request with mapping ID
3. Edge function fetches data from Glide API
4. Data is transformed to match Supabase schema
5. **Override Mode**: All PostgreSQL constraints and triggers are disabled
6. For estimate lines, special sync functions are called
7. **Cleanup Mode**: System fixes inconsistent data and re-enables constraints
8. Results and errors are logged and returned to client

## Handling Inconsistent Data

The Glidebase sync system is designed to handle inconsistent data from Glide:

1. **Complete Override**: During sync, all PostgreSQL rules and constraints are temporarily disabled
2. **Accept All Data**: The system accepts all data from Glide, even if it would normally violate constraints
3. **Automatic Repair**: After sync, the system automatically:
   - Creates missing related records
   - Fixes invalid display names
   - Updates calculated fields
4. **Logging**: The system logs all repairs for later review

This approach ensures that sync operations always succeed, even with inconsistent data, allowing for later cleanup and data quality improvements.

## Relationship Handling

The Glidebase system uses a specific pattern for relationships:

- No actual foreign key constraints in PostgreSQL
- Relationships are maintained through `rowid_` fields
- Missing related records are created as placeholders during sync
- Indexes on relationship fields optimize performance
