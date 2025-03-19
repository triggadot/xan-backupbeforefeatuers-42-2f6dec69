
# Glide Sync Application

This application provides a robust synchronization system between Glide applications and a Supabase database, enabling bi-directional data flow, transformation, and validation.

## Overview

The Glide Sync application is designed to synchronize data between [Glide Apps](https://www.glideapps.com/) and a Supabase PostgreSQL database. It provides:

- Automated synchronization of data with configurable mappings
- Bi-directional sync (Glide → Supabase, Supabase → Glide, or both)
- Detailed monitoring of sync operations
- Error tracking and resolution
- Comprehensive client management

## Architecture

The application follows a modern React architecture with TypeScript for type safety:

- **Frontend**: React with Tailwind CSS and shadcn/ui components
- **State Management**: React Query for server state, React Context for UI state
- **API Integration**: Supabase client and Edge Functions for backend logic
- **Database**: PostgreSQL (Supabase) with Row Level Security

## Key Features

### Connection Management

Manage connections to Glide applications with secure API key storage and automatic connection testing.

- **Table**: `gl_connections`
  - `id`: Unique identifier
  - `api_key`: Glide API key (secured)
  - `app_id`: Glide application ID
  - `app_name`: Name of the Glide application
  - `status`: Connection status (active/inactive)
  - `last_sync`: Timestamp of last synchronization
  - `settings`: JSON field for additional configuration
  - `created_at`: Timestamp of creation

### Table Mapping

Configure which Glide tables map to which Supabase tables, including column mappings.

- **Table**: `gl_mappings`
  - `id`: Unique identifier
  - `connection_id`: Reference to connection
  - `glide_table`: Glide table identifier
  - `glide_table_display_name`: Human-readable table name
  - `supabase_table`: Target Supabase table name
  - `column_mappings`: JSON object defining field mappings
  - `sync_direction`: Direction of sync (to_supabase, to_glide, both)
  - `enabled`: Whether this mapping is active
  - `created_at`/`updated_at`: Timestamps

### Synchronization Logs

Track all sync operations with detailed information.

- **Table**: `gl_sync_logs`
  - `id`: Unique identifier
  - `mapping_id`: Reference to mapping
  - `status`: Operation status (started, completed, failed)
  - `message`: Additional information about operation
  - `records_processed`: Count of records processed
  - `started_at`/`completed_at`: Operation timestamps

### Error Tracking

Monitor and resolve sync errors.

- **Table**: `gl_sync_errors`
  - `id`: Unique identifier
  - `mapping_id`: Reference to mapping
  - `error_type`: Category of error
  - `error_message`: Detailed error information
  - `record_data`: JSON data about the record that failed
  - `retryable`: Whether the error can be automatically retried
  - `created_at`: Error timestamp
  - `resolved_at`: Resolution timestamp (if resolved)
  - `resolution_notes`: Notes about resolution

## Business Data Schema

The application includes a comprehensive business management system with the following key entities:

### Accounts

- **Table**: `gl_accounts`
  - `id`, `glide_row_id`: Identifiers
  - `accounts_uid`: Unique account identifier
  - `account_name`: Business name
  - `client_type`: Type (Customer, Vendor, Customer & Vendor)
  - `email_of_who_added`: User who created the account
  - `date_added_client`: When account was added
  - `photo`: Image reference

### Products

- **Table**: `gl_products`
  - `id`, `glide_row_id`: Identifiers
  - `vendor_product_name`: Original product name
  - `new_product_name`: Customized product name
  - `display_name`: Name to display (derived)
  - `category`: Product category
  - `cost`: Unit cost
  - `total_qty_purchased`: Total purchased quantity
  - `product_purchase_date`: When product was purchased
  - `rowid_purchase_orders`: Link to purchase order
  - `rowid_accounts`: Vendor account reference
  - `total_units_behind_sample`: Inventory reserved for samples

### Invoices

- **Table**: `gl_invoices`
  - `id`, `glide_row_id`: Identifiers
  - `rowid_accounts`: Customer reference
  - `invoice_order_date`: Date of invoice
  - `total_amount`: Total invoice amount (calculated)
  - `total_paid`: Total payments received (calculated)
  - `balance`: Remaining balance (calculated)
  - `payment_status`: Status (draft, unpaid, partial, paid, overdue)

- **Related Table**: `gl_invoice_lines`
  - `id`, `glide_row_id`: Identifiers
  - `rowid_invoices`: Invoice reference
  - `rowid_products`: Product reference
  - `renamed_product_name`: Custom product name for this sale
  - `qty_sold`: Quantity sold
  - `selling_price`: Unit price
  - `line_total`: Total line amount (calculated)

### Purchase Orders

- **Table**: `gl_purchase_orders`
  - `id`, `glide_row_id`: Identifiers
  - `rowid_accounts`: Vendor reference
  - `purchase_order_uid`: Generated PO identifier
  - `po_date`: Order date
  - `total_amount`: Total PO amount (calculated)
  - `total_paid`: Total payments made (calculated)
  - `balance`: Remaining balance (calculated)
  - `payment_status`: Status (draft, received, partial, complete)

### Estimates

- **Table**: `gl_estimates`
  - `id`, `glide_row_id`: Identifiers
  - `rowid_accounts`: Customer reference
  - `estimate_date`: Date of estimate
  - `total_amount`: Total estimate amount (calculated)
  - `total_credits`: Total applied credits (calculated)
  - `balance`: Remaining balance (calculated)
  - `status`: Status (draft, pending, converted)
  - `is_a_sample`: Whether this is a sample (affects inventory)
  - `valid_final_create_invoice_clicked`: Converted to invoice flag

## Glide API Integration

The application communicates with Glide using their API:

### Reading Data (Query)

Endpoint: `https://api.glideapp.io/api/function/queryTables`

Request format:
```json
{
  "appID": "YOUR_APP_ID",
  "queries": [
    {
      "tableName": "YOUR_TABLE_NAME",
      "startAt": "CONTINUATION_TOKEN" // Optional
    }
  ]
}
```

For Big Tables, SQL-style queries:
```json
{
  "appID": "YOUR_APP_ID",
  "queries": [
    {
      "sql": "SELECT * FROM \"TableName\" WHERE \"Column\" = $1",
      "params": ["Value"]
    }
  ]
}
```

### Writing Data (Mutations)

Endpoint: `https://api.glideapp.io/api/function/mutateTables`

Request format:
```json
{
  "appID": "YOUR_APP_ID",
  "mutations": [
    // Up to 500 mutations
  ]
}
```

#### Mutation Types:

1. **Add Row**:
```json
{
  "kind": "add-row-to-table",
  "tableName": "YOUR_TABLE_NAME",
  "columnValues": {
    "Column1": "Value1",
    "Column2": "Value2"
  }
}
```

2. **Update Row**:
```json
{
  "kind": "set-columns-in-row",
  "tableName": "YOUR_TABLE_NAME",
  "columnValues": {
    "Column1": "UpdatedValue1"
  },
  "rowID": "row123"
}
```

3. **Delete Row**:
```json
{
  "kind": "delete-row",
  "tableName": "YOUR_TABLE_NAME",
  "rowID": "row123" 
}
```

## Synchronization Process

1. **Table Discovery**: List available tables in Glide application
2. **Column Mapping**: Configure which Glide columns map to which Supabase columns
3. **Validation**: Verify mapping configuration and data types
4. **Data Transfer**:
   - **Glide → Supabase**: Read from Glide API, transform, and insert to Supabase
   - **Supabase → Glide**: Read from Supabase, transform, and send mutations to Glide
5. **Logging**: Record operation details and any errors
6. **Error Handling**: Track, report, and provide resolution for errors

## Automatic Calculations

The system includes several automatic calculations through database triggers:

- **Invoice Totals**: Sum of line items, applied payments, and balance
- **Purchase Order Totals**: Sum of associated products, payments, and balance
- **Estimate Totals**: Sum of line items, applied credits, and balance
- **Product Inventory**: Track available inventory based on purchases, sales, and samples
- **Document Status**: Automatically update status based on payments and other factors

## Row Identifiers

The system uses `glide_row_id` in all tables to store Glide's unique `$rowID` for each record, enabling bidirectional syncing.

## Getting Started

### Prerequisites

- Node.js & npm
- Supabase account
- Glide account with API access

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

### Configuration

1. Create Glide connections with valid API keys
2. Configure table mappings between Glide and Supabase
3. Test connections and validate mappings
4. Enable sync for desired mappings

## Development Guidelines

Please refer to our documentation files for detailed development guidelines:

- [Sync Architecture](docs/SYNC_ARCHITECTURE.md): Detailed explanation of the sync system
- [Code Organization](docs/CODE_ORGANIZATION.md): Code structure and patterns
- [Project Knowledge Base](docs/PROJECT_KNOWLEDGE_BASE.md): General project information

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Query
- Supabase (Database, Authentication, Edge Functions)
