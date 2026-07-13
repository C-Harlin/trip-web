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

alter table public.trip_members
  add column if not exists display_name text;

create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  label text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;

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

drop policy if exists "owners can read invites" on public.trip_invites;
create policy "owners can read invites" on public.trip_invites
for select using (
  exists (
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

-- Legacy reusable invitation links are intentionally disabled. New invitations
-- are one-time records managed by the trip owner.
revoke execute on function public.join_trip(uuid, uuid) from public, anon, authenticated;

create or replace function public.create_trip_invite(
  target_trip_id uuid,
  invite_label text,
  valid_for_days integer default 7
)
returns public.trip_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  created_invite public.trip_invites;
begin
  if auth.uid() is null or not exists (
    select 1 from public.trips
    where id = target_trip_id and owner_id = auth.uid()
  ) then
    raise exception 'owner_required';
  end if;

  if length(trim(invite_label)) = 0 then
    raise exception 'invite_label_required';
  end if;

  insert into public.trip_invites (trip_id, label, created_by, expires_at)
  values (
    target_trip_id,
    left(trim(invite_label), 80),
    auth.uid(),
    now() + make_interval(days => greatest(1, least(valid_for_days, 30)))
  )
  returning * into created_invite;

  return created_invite;
end;
$$;

create or replace function public.accept_trip_invite(
  target_invite_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_invite public.trip_invites;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select * into matched_invite
  from public.trip_invites
  where token = target_invite_token
  for update;

  if matched_invite.id is null
    or matched_invite.revoked_at is not null
    or matched_invite.expires_at <= now() then
    raise exception 'invite_invalid_or_expired';
  end if;

  if matched_invite.accepted_by is not null
    and matched_invite.accepted_by <> auth.uid() then
    raise exception 'invite_already_used';
  end if;

  insert into public.trip_members (trip_id, user_id, role, display_name)
  values (matched_invite.trip_id, auth.uid(), 'editor', matched_invite.label)
  on conflict (trip_id, user_id) do update
  set role = 'editor', display_name = excluded.display_name;

  update public.trip_invites
  set accepted_by = auth.uid(), accepted_at = coalesce(accepted_at, now())
  where id = matched_invite.id;

  return matched_invite.trip_id;
end;
$$;

create or replace function public.revoke_trip_invite(target_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.trip_invites invite
  set revoked_at = now()
  where invite.id = target_invite_id
    and invite.accepted_at is null
    and exists (
      select 1 from public.trips
      where id = invite.trip_id and owner_id = auth.uid()
    );

  if not found then raise exception 'invite_not_found'; end if;
end;
$$;

create or replace function public.remove_trip_member(
  target_trip_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.trips
    where id = target_trip_id and owner_id = auth.uid()
  ) then
    raise exception 'owner_required';
  end if;

  delete from public.trip_members
  where trip_id = target_trip_id
    and user_id = target_user_id
    and role <> 'owner';

  if not found then raise exception 'member_not_found'; end if;
end;
$$;

revoke execute on function public.create_trip_invite(uuid, text, integer) from public, anon;
revoke execute on function public.accept_trip_invite(uuid) from public, anon;
revoke execute on function public.revoke_trip_invite(uuid) from public, anon;
revoke execute on function public.remove_trip_member(uuid, uuid) from public, anon;
grant execute on function public.create_trip_invite(uuid, text, integer) to authenticated;
grant execute on function public.accept_trip_invite(uuid) to authenticated;
grant execute on function public.revoke_trip_invite(uuid) to authenticated;
grant execute on function public.remove_trip_member(uuid, uuid) to authenticated;

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
