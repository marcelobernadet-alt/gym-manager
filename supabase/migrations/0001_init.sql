-- Gym Manager initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ===================== profiles =====================
-- profiles.id is independent from auth.users.id on purpose: it lets the owner
-- register a new member (name/email/phone + membership) before that person
-- has ever logged in. auth_user_id gets filled in automatically, by email,
-- the first time they actually sign in with Google.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'owner')),
  phone text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_email_idx on profiles (lower(email));

-- Security-definer helpers so RLS policies can check identity/role without
-- recursively evaluating the profiles RLS policy on itself.
create or replace function current_profile_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from profiles where auth_user_id = auth.uid();
$$;

create or replace function is_current_owner()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'owner');
$$;

alter table profiles enable row level security;

create policy "profiles_select_own_or_owner"
  on profiles for select
  using (auth_user_id = auth.uid() or is_current_owner());

create policy "profiles_insert_own_or_owner"
  on profiles for insert
  with check (auth_user_id = auth.uid() or is_current_owner());

create policy "profiles_update_own_or_owner"
  on profiles for update
  using (auth_user_id = auth.uid() or is_current_owner());

-- Links to (or creates) the profile row the first time someone signs in.
-- If the owner already registered this person by email, this links that
-- existing profile instead of creating a duplicate.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update profiles
  set
    auth_user_id = new.id,
    full_name = case when full_name = '' then coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '') else full_name end,
    avatar_url = coalesce(avatar_url, new.raw_user_meta_data->>'avatar_url')
  where lower(email) = lower(new.email) and auth_user_id is null;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    insert into profiles (auth_user_id, email, full_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      new.raw_user_meta_data->>'avatar_url'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ===================== memberships =====================

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  plan_name text not null,
  price numeric(10, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'expired', 'paused', 'cancelled')),
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now()
);

alter table memberships enable row level security;

create policy "memberships_select_own_or_owner"
  on memberships for select
  using (client_id = current_profile_id() or is_current_owner());

create policy "memberships_owner_write"
  on memberships for all
  using (is_current_owner())
  with check (is_current_owner());

-- ===================== classes & sessions =====================

create table if not exists gym_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  instructor_name text,
  duration_min int not null default 60,
  category text,
  color text not null default '#4285F4',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table gym_classes enable row level security;

create policy "gym_classes_select_all"
  on gym_classes for select
  using (true);

create policy "gym_classes_owner_write"
  on gym_classes for all
  using (is_current_owner())
  with check (is_current_owner());

create table if not exists class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references gym_classes (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity int not null default 15,
  location text,
  created_at timestamptz not null default now()
);

create index if not exists class_sessions_start_time_idx on class_sessions (start_time);

alter table class_sessions enable row level security;

create policy "class_sessions_select_all"
  on class_sessions for select
  using (true);

create policy "class_sessions_owner_write"
  on class_sessions for all
  using (is_current_owner())
  with check (is_current_owner());

-- ===================== bookings =====================

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'attended', 'no_show')),
  created_at timestamptz not null default now(),
  unique (session_id, client_id)
);

alter table bookings enable row level security;

create policy "bookings_select_own_or_owner"
  on bookings for select
  using (client_id = current_profile_id() or is_current_owner());

create policy "bookings_insert_own_or_owner"
  on bookings for insert
  with check (client_id = current_profile_id() or is_current_owner());

create policy "bookings_update_own_or_owner"
  on bookings for update
  using (client_id = current_profile_id() or is_current_owner());

-- ===================== products =====================

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  currency text not null default 'ARS',
  stock int not null default 0,
  image_url text,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "products_select_active_or_owner"
  on products for select
  using (is_active or is_current_owner());

create policy "products_owner_write"
  on products for all
  using (is_current_owner())
  with check (is_current_owner());

-- ===================== orders & order_items =====================

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles (id) on delete set null,
  created_by uuid not null references profiles (id),
  total numeric(10, 2) not null default 0,
  status text not null default 'paid' check (status in ('pending', 'paid', 'cancelled')),
  payment_method text not null default 'manual',
  source text not null default 'store' check (source in ('store', 'pos')),
  notes text,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

create policy "orders_select_own_or_owner"
  on orders for select
  using (client_id = current_profile_id() or created_by = current_profile_id() or is_current_owner());

create policy "orders_insert_own_or_owner"
  on orders for insert
  with check (created_by = current_profile_id());

create policy "orders_update_owner"
  on orders for update
  using (is_current_owner());

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id),
  quantity int not null default 1,
  unit_price numeric(10, 2) not null default 0
);

alter table order_items enable row level security;

create policy "order_items_select_via_order"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.client_id = current_profile_id() or o.created_by = current_profile_id() or is_current_owner())
    )
  );

create policy "order_items_insert_via_order"
  on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.created_by = current_profile_id()
    )
  );

-- ===================== bootstrap the first owner =====================
-- After you sign in once with your own Google account, run this (with your email)
-- to promote yourself to owner:
--
--   update profiles set role = 'owner' where lower(email) = lower('tu-email@gmail.com');
