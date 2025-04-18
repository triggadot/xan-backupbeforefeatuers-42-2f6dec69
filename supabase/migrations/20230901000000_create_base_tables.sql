-- This migration creates the base tables needed for the application
-- Author: System
-- Date: 2023-09-01
-- Purpose: Create essential tables before PDF trigger migrations

-- Create the gl_invoices table
create table if not exists public.gl_invoices (
  id uuid primary key default gen_random_uuid(),
  glide_row_id text not null,
  rowid_accounts text,
  date_of_invoice timestamp with time zone,
  created_timestamp timestamp with time zone,
  submitted_timestamp timestamp with time zone,
  user_email text,
  notes text,
  glide_pdf_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  total_amount numeric default 0,
  total_paid numeric default 0,
  balance numeric default 0,
  payment_status text default 'draft',
  invoice_uid text,
  supabase_pdf_url text,
  is_processed boolean default false
);

-- Enable Row Level Security
alter table public.gl_invoices enable row level security;

-- Create policy for authenticated users
create policy "Allow full access for authenticated users" on public.gl_invoices
  for all
  to authenticated
  using (true)
  with check (true);

-- Create policy for anonymous users
create policy "Allow reading for anonymous users" on public.gl_invoices
  for select
  to anon
  using (true);

-- Create the gl_estimates table
create table if not exists public.gl_estimates (
  id uuid primary key default gen_random_uuid(),
  glide_row_id text not null,
  rowid_invoices text,
  rowid_accounts text,
  estimate_date timestamp with time zone,
  is_a_sample boolean default false,
  date_invoice_created timestamp with time zone,
  is_note_added boolean default false,
  is_invoice_created boolean default false,
  glide_pdf_url text,
  glide_pdf_url_secondary text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  total_amount numeric default 0,
  total_credits numeric default 0,
  balance numeric default 0,
  estimate_uid text,
  status text default 'draft',
  supabase_pdf_url text
);

-- Enable Row Level Security
alter table public.gl_estimates enable row level security;

-- Create policy for authenticated users
create policy "Allow full access for authenticated users" on public.gl_estimates
  for all
  to authenticated
  using (true)
  with check (true);

-- Create policy for anonymous users
create policy "Allow reading for anonymous users" on public.gl_estimates
  for select
  to anon
  using (true);

-- Create the gl_purchase_orders table
create table if not exists public.gl_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  glide_row_id text not null,
  po_date timestamp with time zone,
  rowid_accounts text,
  purchase_order_uid text,
  date_payment_date_mddyyyy timestamp with time zone,
  glide_pdf_url_secondary text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  glide_pdf_url text,
  total_amount numeric default 0,
  total_paid numeric default 0,
  balance numeric default 0,
  payment_status text default 'draft',
  product_count integer default 0,
  supabase_pdf_url text
);

-- Enable Row Level Security
alter table public.gl_purchase_orders enable row level security;

-- Create policy for authenticated users
create policy "Allow full access for authenticated users" on public.gl_purchase_orders
  for all
  to authenticated
  using (true)
  with check (true);

-- Create policy for anonymous users
create policy "Allow reading for anonymous users" on public.gl_purchase_orders
  for select
  to anon
  using (true);

-- Create the pdf_generation_logs table
create table if not exists public.pdf_generation_logs (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  document_id text not null,
  trigger_source text not null,
  trigger_type text not null,
  success boolean default true,
  error_message text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.pdf_generation_logs enable row level security;

-- Create policy for authenticated users
create policy "Allow full access for authenticated users" on public.pdf_generation_logs
  for all
  to authenticated
  using (true)
  with check (true);

-- Create the pdf_generation_failures table
create table if not exists public.pdf_generation_failures (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  document_id text not null,
  error_message text,
  retry_count integer default 0,
  resolved boolean default false,
  created_at timestamp with time zone default now(),
  last_attempt timestamp with time zone default now(),
  next_attempt timestamp with time zone,
  resolved_at timestamp with time zone
);

-- Enable Row Level Security
alter table public.pdf_generation_failures enable row level security;

-- Create policy for authenticated users
create policy "Allow full access for authenticated users" on public.pdf_generation_failures
  for all
  to authenticated
  using (true)
  with check (true);

-- Create the gl_pdf_generation_queue table
create table if not exists public.gl_pdf_generation_queue (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  document_id uuid not null,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  processed_at timestamp with time zone,
  attempts integer default 0,
  last_error text
);

-- Enable Row Level Security
alter table public.gl_pdf_generation_queue enable row level security;

-- Create policy for authenticated users
create policy "Allow full access for authenticated users" on public.gl_pdf_generation_queue
  for all
  to authenticated
  using (true)
  with check (true);

-- Add comment for better documentation
comment on table public.gl_pdf_generation_queue is 'Queue for documents that need PDFs generated';
