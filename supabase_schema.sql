-- Margdarshak Supabase Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  age integer,
  current_stage text check (current_stage in ('school', '12th', 'undergrad', 'postgrad', 'working')),
  class_or_year text,
  marks_percentage_or_cgpa numeric,
  category text,
  income_bracket numeric,
  state text,
  district text,
  interests text[] default '{}',
  gender text,
  first_generation_learner boolean default false,
  created_at timestamptz default now()
);

-- 2. User Roles Table
create type user_role_type as enum ('student', 'moderator', 'admin');

create table public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  role user_role_type not null default 'student',
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz default now()
);

-- 3. Opportunities Table
create type extraction_confidence_type as enum ('low', 'medium', 'high');
create type moderation_status_type as enum ('pending', 'approved', 'rejected');

create table public.opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text check (type in ('scholarship', 'fellowship', 'internship', 'program')),
  provider text not null,
  description text,
  source_url text unique not null,
  apply_url text,
  source_domain text not null,
  last_verified_at timestamptz default now(),
  extraction_confidence extraction_confidence_type not null default 'low',
  moderation_status moderation_status_type not null default 'pending',
  registration_open_date date,
  registration_close_date date,
  eligibility_rules jsonb default '{}'::jsonb,
  required_documents text[] default '{}',
  amount_or_benefit text,
  created_at timestamptz default now()
);

-- 4. Applications Table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  opportunity_id uuid references public.opportunities(id) on delete cascade not null,
  status text check (status in ('saved', 'in_progress', 'submitted', 'result')) not null,
  notes text,
  updated_at timestamptz default now(),
  unique (user_id, opportunity_id)
);

-- 5. Search Queries Log Table
create table public.search_queries_log (
  id uuid default gen_random_uuid() primary key,
  query_text text unique not null,
  last_run_at timestamptz default now(),
  result_count integer default 0
);

-- 6. Data Issues Table (Validation Failures)
create table public.data_issues (
  id uuid default gen_random_uuid() primary key,
  source text not null,
  reason text not null,
  raw_payload jsonb not null,
  created_at timestamptz default now()
);

-- 7. Moderation Audit Log Table
create table public.moderation_audit_log (
  id uuid default gen_random_uuid() primary key,
  moderator_id uuid references public.profiles(id) not null,
  opportunity_id uuid references public.opportunities(id) not null,
  action text not null, -- 'approved', 'rejected', 'edited_and_approved'
  edits jsonb,
  created_at timestamptz default now()
);

-- RLS & Policies Setup
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.search_queries_log enable row level security;
alter table public.data_issues enable row level security;
alter table public.moderation_audit_log enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- User roles policies
create policy "Users can view own role" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles
  for select using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
create policy "Admins can manage roles" on public.user_roles
  for all using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Opportunities policies
create policy "Students can view approved opportunities" on public.opportunities
  for select using (
    moderation_status = 'approved' or
    exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator', 'admin'))
  );
create policy "Moderators and admins can manage opportunities" on public.opportunities
  for all using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator', 'admin'))
  );

-- Applications policies
create policy "Users can view own applications" on public.applications
  for select using (auth.uid() = user_id);
create policy "Users can modify own applications" on public.applications
  for all using (auth.uid() = user_id);

-- Moderation log policies
create policy "Moderators and admins can view audit logs" on public.moderation_audit_log
  for select using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator', 'admin'))
  );

-- 8. User Documents Table (Document Vault)
create table public.user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  doc_type text not null, -- 'Income Certificate', 'Marksheet', 'Caste Certificate', 'Aadhar Card', 'Domicile Certificate', 'Other'
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz default now(),
  unique (user_id, doc_type)
);

alter table public.user_documents enable row level security;

create policy "Users can view own documents" on public.user_documents
  for select using (auth.uid() = user_id);
create policy "Users can manage own documents" on public.user_documents
  for all using (auth.uid() = user_id);

-- Triggers for User Roles
create or replace function public.handle_new_user_role()
returns trigger as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_role();

-- Helper Function to Seed Admin by Email
-- Use this query after the user registers to promote them to admin:
-- 
-- insert into public.profiles (id, name)
-- select id, 'Admin' from auth.users where email = 'harshvsingh.contact@gmail.com'
-- on conflict (id) do nothing;
-- 
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'harshvsingh.contact@gmail.com'
-- on conflict (user_id) do update set role = 'admin';
