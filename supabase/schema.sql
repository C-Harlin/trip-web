create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  invite_token uuid not null default gen_random_uuid() unique,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips
  add column if not exists invite_token uuid not null default gen_random_uuid();
create unique index if not exists trips_invite_token_key on public.trips(invite_token);

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = target_trip_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_trip(target_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = target_trip_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

drop policy if exists "members can read trips" on public.trips;
create policy "members can read trips" on public.trips
for select using (public.is_trip_member(id) or owner_id = auth.uid());

drop policy if exists "users can create trips" on public.trips;
create policy "users can create trips" on public.trips
for insert with check (owner_id = auth.uid());

drop policy if exists "editors can update trips" on public.trips;
create policy "editors can update trips" on public.trips
for update using (public.can_edit_trip(id));

drop policy if exists "members can read memberships" on public.trip_members;
create policy "members can read memberships" on public.trip_members
for select using (public.is_trip_member(trip_id));

drop policy if exists "owners can add members" on public.trip_members;
create policy "owners can add members" on public.trip_members
for insert with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.trips
    where id = trip_id and owner_id = auth.uid()
  )
);

create or replace function public.create_trip(trip_title text, trip_document jsonb)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  created_trip public.trips;
begin
  insert into public.trips (title, owner_id, document)
  values (trip_title, auth.uid(), trip_document)
  returning * into created_trip;

  insert into public.trip_members (trip_id, user_id, role)
  values (created_trip.id, auth.uid(), 'owner');

  return created_trip;
end;
$$;

create or replace function public.update_trip_document(
  target_trip_id uuid,
  expected_version bigint,
  next_document jsonb
)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_trip public.trips;
begin
  if not public.can_edit_trip(target_trip_id) then
    raise exception 'not_authorized';
  end if;

  update public.trips
  set document = next_document,
      version = version + 1,
      updated_at = now()
  where id = target_trip_id and version = expected_version
  returning * into updated_trip;

  if updated_trip.id is null then
    raise exception 'version_conflict';
  end if;

  return updated_trip;
end;
$$;

create or replace function public.join_trip(target_trip_id uuid, target_invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.trips
    where id = target_trip_id and invite_token = target_invite_token
  ) then
    raise exception 'invalid_invite';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (target_trip_id, auth.uid(), 'editor')
  on conflict (trip_id, user_id) do nothing;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;
end $$;
