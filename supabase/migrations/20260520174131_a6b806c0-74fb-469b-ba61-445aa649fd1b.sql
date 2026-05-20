create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  work_email text not null,
  company_name text not null,
  company_type text not null,
  num_locations text not null,
  help_with text not null,
  message text,
  source text not null default 'website_booking_modal'
);
alter table public.leads enable row level security;