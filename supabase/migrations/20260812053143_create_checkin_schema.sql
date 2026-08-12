-- Guests: one row per known phone number
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Check-ins: append-only log, one row per check-in event
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  phone text not null,
  name text not null,
  checked_in_at timestamptz not null default now()
);

create index check_ins_checked_in_at_idx on public.check_ins (checked_in_at desc);
create index check_ins_phone_idx on public.check_ins (phone);

alter table public.guests enable row level security;
alter table public.check_ins enable row level security;
-- No policies are created: anon/public roles get zero direct table access.
-- All access goes through the SECURITY DEFINER RPC functions below.

-- Returns the current total number of check-ins (for initial page load).
create or replace function public.get_check_in_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.check_ins;
$$;

-- Atomically checks a guest in by phone number.
-- If the phone is unknown and p_name is null/blank, raises 'NAME_REQUIRED'
-- so the client can prompt for a name and retry with it supplied.
-- If the phone is unknown and p_name is supplied, creates the guest first.
create or replace function public.check_in_guest(p_phone text, p_name text default null)
returns table (
  guest_name text,
  is_new_guest boolean,
  total_check_ins bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := trim(p_phone);
  v_name text := nullif(trim(p_name), '');
  v_guest_id uuid;
  v_guest_name text;
  v_is_new boolean := false;
begin
  if v_phone is null or v_phone = '' then
    raise exception 'PHONE_REQUIRED';
  end if;

  select id, name into v_guest_id, v_guest_name
  from public.guests
  where phone = v_phone;

  if v_guest_id is null then
    if v_name is null then
      raise exception 'NAME_REQUIRED';
    end if;

    insert into public.guests (phone, name)
    values (v_phone, v_name)
    returning id, name into v_guest_id, v_guest_name;

    v_is_new := true;
  end if;

  insert into public.check_ins (guest_id, phone, name)
  values (v_guest_id, v_phone, v_guest_name);

  return query
    select v_guest_name, v_is_new, (select count(*) from public.check_ins);
end;
$$;

revoke all on public.guests from anon, authenticated;
revoke all on public.check_ins from anon, authenticated;
grant execute on function public.get_check_in_count() to anon, authenticated;
grant execute on function public.check_in_guest(text, text) to anon, authenticated;
