# Technical Context

## Frontend Stack
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Component Libraries**:
  - Shadcn UI for base components
  - Preline UI for business components
  - Tremor for dashboards and data visualization
- **State Management**: React Context and Hooks
- **Data Fetching**: TanStack Query (react-query)
- **Form Handling**: React Hook Form with Zod validation
- **PDF Handling**: jsPDF, jszip, file-saver

## Backend Stack
- **Database**: Supabase PostgreSQL (Project ID: swrfsullhirscyxqneay)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for PDFs and files
- **Server Logic**: Supabase Edge Functions
- **Connection**: `supabase` client from `@/integrations/supabase/client`

## Database Schema
Core tables include:

### gl_accounts
```sql
create table public.gl_accounts (
  id uuid not null default gen_random_uuid(),
  glide_row_id text null,
  account_name text null,
  client_type text null,
  accounts_uid text not null default ('ACC'::text || "substring"((gen_random_uuid())::text, 1, 8)),
  date_added_client timestamp with time zone null,
  email_of_who_added text null,
  photo text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  balance numeric null default 0,
  vendor_balance numeric null,
  customer_balance numeric null,
  constraint gl_accounts_pkey primary key (id),
  constraint accounts_uid_unique unique (accounts_uid),
  constraint gl_accounts_glide_row_id_key unique (glide_row_id),
  constraint client_type_check check (client_type = any(array['Customer'::text, 'Vendor'::text, 'Customer & Vendor'::text]))
)
```

### gl_invoices
```sql
create table public.gl_invoices (
  id uuid not null default gen_random_uuid(),
  glide_row_id text not null,
  rowid_accounts text null,
  invoice_order_date timestamp with time zone null,
  created_timestamp timestamp with time zone null,
  submitted_timestamp timestamp with time zone null,
  processed boolean null,
  user_email text null,
  notes text null,
  doc_glideforeverlink text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  total_amount numeric null default 0,
  total_paid numeric null default 0,
  balance numeric null default 0,
  payment_status text null default 'draft'::text,
  tax_rate numeric null default 0,
  tax_amount numeric null default 0,
  due_date timestamp with time zone null,
  constraint gl_invoices_pkey primary key (id),
  constraint gl_invoices_glide_row_id_key unique (glide_row_id)
)
```

### gl_purchase_orders
```sql
create table public.gl_purchase_orders (
  id uuid not null default gen_random_uuid(),
  glide_row_id text not null,
  po_date timestamp with time zone null,
  rowid_accounts text null,
  purchase_order_uid text null,
  date_payment_date_mddyyyy timestamp with time zone null,
  docs_shortlink text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  pdf_link text null,
  total_amount numeric null default 0,
  total_paid numeric null default 0,
  balance numeric null default 0,
  payment_status text null default 'draft'::text,
  product_count integer null default 0,
  constraint gl_purchase_orders_pkey primary key (id),
  constraint gl_purchase_orders_glide_row_id_key unique (glide_row_id)
)
```

### gl_products
```sql
create table public.gl_products (
  id uuid not null default gen_random_uuid(),
  glide_row_id text not null,
  rowid_accounts text null,
  rowid_vendor_payments text null,
  rowid_purchase_orders text null,
  po_poui_dfrom_add_prod text null,
  po_po_date timestamp with time zone null,
  vendor_product_name text null,
  new_product_name text null,
  product_purchase_date timestamp with time zone null,
  total_qty_purchased numeric null,
  cost numeric null,
  samples_or_fronted boolean null,
  fronted boolean null,
  terms_for_fronted_product text null,
  samples boolean null,
  total_units_behind_sample numeric null,
  purchase_notes text null,
  miscellaneous_items boolean null,
  category text null,
  product_image1 text null,
  date_timestamp_subm timestamp with time zone null,
  email_email_of_user_who_added_product text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  display_name text GENERATED ALWAYS as (COALESCE(new_product_name, vendor_product_name)) STORED null,
  constraint gl_products_pkey primary key (id),
  constraint gl_products_glide_row_id_key unique (glide_row_id)
)
```

## Integration Systems
- **Glide Apps Integration**: Bidirectional sync system using edge functions
  - Core components: `MappingDetails.tsx`, `SyncDashboard.tsx`, `useGlSync.ts`
  - Complete override mode during sync: constraints temporarily disabled
  - Data flow: Edge function → Glide API → Transform → Sync functions
  - Inconsistent data handling with automatic repair

- **PDF System**: Generation, storage and sharing capabilities
  - PDF Preview Modal for in-app viewing
  - PDF Share Link Component for clipboard/email sharing
  - PDF Caching System to avoid regenerating unchanged documents
  - Batch PDF Generation for multiple documents
  - URL storage using `supabase_pdf_url` field (not `pdf_url` which is for internal Glide use)

- **Customer & Vendor Payment System**:
  - Customer payments (`gl_customer_payments`) tied to invoices
  - Vendor payments (`gl_vendor_payments`) tied to purchase orders
  - Credits (`gl_customer_credits`) tied to estimates
  - Automatic balance calculation via triggers
