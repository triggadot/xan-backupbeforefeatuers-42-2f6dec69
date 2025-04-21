Glide Sync Architecture
This document details the architecture and workflow of our Glide synchronization system.
Overview
The Glide sync system facilitates bidirectional data synchronization between our Supabase database and Glide applications. It handles data mapping, transformation, error handling, and validation to ensure consistent data across both platforms.
System Components
1. Database Layer
Tables

gl_connections: Stores Glide API connection credentials and settings
gl_mappings: Defines the relationship between Glide tables and Supabase tables
gl_sync_logs: Records sync operations and their results
gl_sync_errors: Stores detailed error information for failed sync operations
gl_[entity]: Domain-specific tables for synced data (e.g., gl_products, gl_accounts)

Views

gl_mapping_status: Real-time view aggregating sync status information for each mapping
gl_recent_logs: Shows recent sync operations with additional context
gl_product_sync_stats: Provides statistics about product synchronization
gl_sync_stats: Aggregates daily sync metrics and statistics
gl_tables_view: Lists available Supabase tables for mapping

Functions

gl_validate_column_mapping: Validates mapping configuration for consistency
gl_get_sync_errors: Retrieves sync errors for a specific mapping
gl_record_sync_error: Records a sync error with contextual information
gl_resolve_sync_error: Marks an error as resolved with resolution notes
glsync_retry_failed_sync: Initiates a retry for a failed sync operation
update_product_inventory: Updates product inventory based on purchase and sales records

2. API Layer
Glide API Endpoints
Query Endpoint: https://api.glideapp.io/api/function/queryTables

Used for reading data from Glide tables
Supports pagination via continuation tokens (next/startAt)
Handles table schema discovery and listing available tables
Supports SQL-like filtering
Returns data in a standardized format with rows and next token

Mutation Endpoint: https://api.glideapp.io/api/function/mutateTables

Used for creating, updating, and deleting records in Glide
Supports batch operations (up to 500 mutations per request)
Requires specific mutation types and structure
Returns success/failure status for each mutation

Edge Functions

glsync: Main edge function handling sync operations:

Testing connections to Glide API
Listing Glide tables and retrieving schema information
Fetching and synchronizing data in both directions
Managing column mappings and data transformations
Handling errors and implementing retry mechanisms



Shared Utilities

glide-api.ts: Functions for interacting with Glide's API

testGlideConnection: Validates API credentials
listGlideTables: Retrieves available tables
getGlideTableColumns: Discovers table schema
fetchGlideTableData: Retrieves records with pagination
sendGlideMutations: Sends batch operations to Glide


cors.ts: Utilities for handling CORS in edge functions
glsync-transformers.ts: Data transformation and validation utilities

Handles type conversions between Glide and Supabase
Manages bidirectional field mapping



3. Application Layer
Components

ConnectionsManager: UI for managing Glide connections
MappingsManager: UI for configuring table mappings
ColumnMappingEditor: UI for setting up field mappings
SyncDashboard: Overview of sync status and operations
SyncMetricsCard: Displays sync statistics and performance metrics
SyncErrorDisplay: Shows and manages sync errors
MappingDetailsCard: Detailed view of a specific mapping

Hooks

useGlSync: Core hook for sync operations
useGlSyncStatus: Hook for fetching sync status information
useGlSyncErrors: Hook for retrieving and managing error records

Data Flow
Sync Process

Initialization:

Retrieve connection information from gl_connections
Load and validate mapping configuration from gl_mappings
Create sync log entry with status "started"


Data Retrieval:

From Glide to Supabase:

Call Glide queryTables API with continuation tokens for pagination
Transform received data according to mapping rules
Apply data type conversions and validations


From Supabase to Glide:

Query Supabase tables with appropriate filters
Transform data according to reverse mapping
Prepare mutation payloads for Glide API




Data Processing:

For each record:

Apply transformations (type conversions, field mappings)
Generate unique identifiers and timestamps
Handle relationships between entities
Validate data integrity




Data Storage:

To Supabase:

Upsert processed records to Supabase tables
Update inventory and related records via triggers


To Glide:

Batch mutations in groups of up to 500 records
Send to mutateTables API endpoint with proper operations
Track success/failure of each batch




Finalization:

Update sync log with completion status
Record metrics (records processed, errors, duration)
Update mapping status view
Trigger any necessary post-sync operations (inventory updates, etc.)



Error Handling

Error Classification:

VALIDATION_ERROR: Data doesn't conform to expected schema
TRANSFORM_ERROR: Error during data transformation
API_ERROR: Glide API failures
RATE_LIMIT: API rate limiting issues
NETWORK_ERROR: Network connectivity problems


Error Processing:

Log detailed error information to gl_sync_errors
Determine if error is retryable
Continue processing other records
Update error counts in status views


Error Resolution:

Surface errors in UI for review
Provide context and resolution suggestions
Support manual resolution with notes
Enable retry operations for retryable errors



Mapping System
Glide API v1 Operations
Glide API operations consist of queries and mutations that follow specific formats:
1. Queries (Reading Data)
The queryTables endpoint reads data from Glide tables. A basic request:
Copycurl -X POST https://api.glideapp.io/api/function/queryTables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "appID": "YOUR_APP_ID",
    "queries": [
      {
        "tableName": "YOUR_TABLE_NAME",
        "startAt": "CONTINUATION_TOKEN"
      }
    ]
  }'
2. Mutations (Creating, Updating, Deleting Data)
The mutateTables endpoint writes data to Glide:
Copycurl -X POST https://api.glideapp.io/api/function/mutateTables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "appID": "YOUR_APP_ID",
    "mutations": [
      {
        "kind": "add-row-to-table",
        "tableName": "YOUR_TABLE_NAME",
        "columnValues": {
          "Column1": "Value1",
          "Column2": "Value2"
        }
      }
    ]
  }'
Mutation Types:

Add Row: add-row-to-table
Update Row: set-columns-in-row (requires rowID)
Delete Row: delete-row (requires rowID)

Column Mapping Structure
jsonCopy{
  "$rowID": {
    "glide_column_name": "$rowID",
    "supabase_column_name": "glide_row_id",
    "data_type": "string"
  },
  "product_name": {
    "glide_column_name": "product_name", 
    "supabase_column_name": "vendor_product_name",
    "data_type": "string"
  }
}
Data Type Handling

string: Text fields
number: Numeric values
boolean: True/false values
date-time: Date and time values
image-uri: URLs pointing to images
email-address: Email formatted strings

Sync Directions

to_supabase: One-way sync from Glide to Supabase
to_glide: One-way sync from Supabase to Glide
both: Bidirectional synchronization

Performance Considerations
Pagination

Glide API limits response size (up to 10,000 rows per request)
Continuation tokens (next in response, startAt in subsequent requests) are used for fetching additional data
Progress tracking is maintained throughout pagination

Batching

Mutations are grouped into batches (max 500 per request)
Implementation balances throughput vs. error management
Each batch has independent error handling

Rate Limiting

Implements exponential backoff for rate limited requests
Maximum retry attempts configurable via constants
Delay between retries increases with each attempt

Real-time Updates

Database changes trigger UI updates via Supabase realtime subscriptions
Sync status and logs are updated in real-time
Fallback polling mechanism ensures data freshness

Validation and Data Integrity

Pre-sync validation ensures mapping configuration is valid
Data type validation before database operations
Automatic type conversion based on mapping specifications
Unique constraints enforce data integrity
Error recovery mechanisms for partial failures

Error Recovery

Failed operations are logged with detailed context
UI displays errors with resolution options
Automatic retries for transient issues
Manual resolution workflow for persistent errors
Resolution notes for documentation and knowledge sharing

Security

API keys are stored securely in the database
Access to sync operations is controlled via application permissions
Database access is controlled via row-level security policies
Edge functions use security definer functions for critical operations

Monitoring and Observability

Sync operation logs stored in gl_sync_logs
Detailed error records in gl_sync_errors
Status views provide at-a-glance system health metrics
Performance metrics track sync efficiency and throughput
Console logging in edge functions for debugging
