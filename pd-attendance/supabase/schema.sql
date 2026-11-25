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

-- =====================================================================
-- Phase 2 – Site management (run this part too if you ran Phase 1 earlier)
-- =====================================================================
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  start_date date,
  status text not null default 'Running' check (status in ('Running','On hold','Finished'))
);
alter table workers drop constraint if exists workers_default_site_fk;
alter table workers add constraint workers_default_site_fk foreign key (default_site_id) references sites(id) on delete set null;

create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  date date not null,
  notes text not null default '',
  workers_count int not null default 0,
  created_by text not null default ''
);
create table if not exists report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references daily_reports(id) on delete cascade,
  photo_url text not null
);
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  text text not null,
  due_date date not null,
  done boolean not null default false
);
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  low_stock_limit numeric not null default 0
);
create table if not exists stock_entries (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  date date not null,
  type text not null check (type in ('IN','OUT')),
  quantity numeric not null check (quantity > 0),
  note text not null default ''
);

alter table sites enable row level security;
alter table daily_reports enable row level security;
alter table report_photos enable row level security;
alter table reminders enable row level security;
alter table materials enable row level security;
alter table stock_entries enable row level security;

create policy "staff sites" on sites for all to authenticated using (true) with check (true);
create policy "staff daily_reports" on daily_reports for all to authenticated using (true) with check (true);
create policy "staff report_photos" on report_photos for all to authenticated using (true) with check (true);
create policy "staff reminders" on reminders for all to authenticated using (true) with check (true);
create policy "staff materials" on materials for all to authenticated using (true) with check (true);
create policy "staff stock_entries" on stock_entries for all to authenticated using (true) with check (true);

-- Photo storage (public bucket; links are long random paths)
insert into storage.buckets (id, name, public) values ('report-photos', 'report-photos', true) on conflict (id) do nothing;
create policy "staff upload photos" on storage.objects for insert to authenticated with check (bucket_id = 'report-photos');
create policy "staff delete photos" on storage.objects for delete to authenticated using (bucket_id = 'report-photos');
