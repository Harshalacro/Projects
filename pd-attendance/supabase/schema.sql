-- P&D Construction – Phase 1 schema (attendance). Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Phase 2 tables (sites, reports, reminders, stock) will be added later.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role text not null default 'supervisor' check (role in ('admin','supervisor'))
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Labour',
  daily_wage numeric not null default 0,
  phone text not null default '',
  active boolean not null default true,
  default_site_id uuid
);

create table if not exists wage_history (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  wage numeric not null,
  from_date date not null
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  date date not null,
  status text not null check (status in ('P','A','H')),
  site_id uuid,
  unique (worker_id, date)
);
create index if not exists attendance_date_idx on attendance(date);

create table if not exists advances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  date date not null,
  amount numeric not null check (amount > 0),
  note text not null default ''
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  month text not null,            -- 'YYYY-MM'
  amount_paid numeric not null,
  paid_date date not null
);

-- Row level security: only logged-in users can touch data.
alter table users enable row level security;
alter table workers enable row level security;
alter table wage_history enable row level security;
alter table attendance enable row level security;
alter table advances enable row level security;
alter table payments enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and role = 'admin');
$$;

create policy "read own profile" on users for select to authenticated using (id = auth.uid() or is_admin());
create policy "admin manages users" on users for all to authenticated using (is_admin()) with check (is_admin());

-- Everyone logged in: workers + attendance
create policy "staff workers" on workers for all to authenticated using (true) with check (true);
create policy "staff attendance" on attendance for all to authenticated using (true) with check (true);
-- Money tables: admin only (supervisors cannot read or write wages/advances/payments)
create policy "admin wage_history" on wage_history for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin advances" on advances for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin payments" on payments for all to authenticated using (is_admin()) with check (is_admin());
