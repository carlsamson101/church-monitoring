-- Church Discipleship & Cell Group Monitoring System
-- Phase 1 + 2: schema, auth profile trigger, helper functions, RLS, audit
-- Run once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

-- ============ TABLES ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  role text not null default 'leader' check (role in ('developer','pastor','leader')),
  status text not null default 'pending' check (status in ('pending','active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cell_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_id uuid unique references public.profiles(id) on delete set null, -- one primary group per leader
  location text,
  meeting_day text,
  meeting_time time,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.disciples (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  nickname text, phone text, email text, address text,
  date_joined date default current_date,
  status text not null default 'new_disciple'
    check (status in ('invitee','new_disciple','active','inactive','transferred','completed')),
  cell_group_id uuid references public.cell_groups(id) on delete set null,
  leader_id uuid references public.profiles(id) on delete set null,
  invited_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  phone text, email text, address text,
  date_invited date default current_date,
  invited_by uuid references public.profiles(id) on delete set null,
  cell_group_id uuid references public.cell_groups(id) on delete set null,
  follow_up_date date,
  status text not null default 'new'
    check (status in ('new','contacted','attended','joined','converted','no_response')),
  converted_disciple_id uuid references public.disciples(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Event types are data, not hard-coded
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_type_id uuid references public.event_types(id) on delete restrict,
  date date not null,
  start_time time, end_time time, location text,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  disciple_id uuid not null references public.disciples(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')),
  recorded_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, disciple_id)
);

create table public.checklist_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  frequency text not null default 'weekly' check (frequency in ('daily','weekly','monthly','once')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.checklist_categories(id) on delete cascade,
  name text not null, description text,
  frequency text not null default 'weekly' check (frequency in ('daily','weekly','monthly','once')),
  required boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_records (
  id uuid primary key default gen_random_uuid(),
  checklist_item_id uuid not null references public.checklist_items(id) on delete cascade,
  disciple_id uuid not null references public.disciples(id) on delete cascade,
  date date not null default current_date,
  completed boolean not null default false,
  recorded_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checklist_item_id, disciple_id, date)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index on public.cell_groups(leader_id);
create index on public.disciples(cell_group_id);
create index on public.disciples(leader_id);
create index on public.disciples(status);
create index on public.invitees(cell_group_id);
create index on public.invitees(status);
create index on public.events(date);
create index on public.events(event_type_id);
create index on public.attendance(disciple_id);
create index on public.checklist_items(category_id);
create index on public.checklist_records(disciple_id, date);
create index on public.audit_logs(created_at desc);

-- ============ updated_at ============
create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','cell_groups','disciples','invitees','event_types','events',
    'attendance','checklist_categories','checklist_items','checklist_records'] loop
    execute format('create trigger trg_%s_updated before update on public.%I
      for each row execute function public.set_updated_at()', t, t);
  end loop; end $$;

-- ============ SECURITY HELPERS ============
-- SECURITY DEFINER so they can read profiles without recursing into RLS.
-- Only ACTIVE profiles get a role; pending/inactive users get NULL = no access.
create function public.get_current_user_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where auth_user_id = auth.uid() and status = 'active' $$;

create function public.is_developer() returns boolean language sql stable security definer
set search_path = public as $$ select coalesce(get_current_user_role() = 'developer', false) $$;
create function public.is_pastor() returns boolean language sql stable security definer
set search_path = public as $$ select coalesce(get_current_user_role() = 'pastor', false) $$;
create function public.is_leader() returns boolean language sql stable security definer
set search_path = public as $$ select coalesce(get_current_user_role() = 'leader', false) $$;
create function public.is_staff() returns boolean language sql stable security definer
set search_path = public as $$ select coalesce(get_current_user_role() in ('developer','pastor'), false) $$;

create function public.get_current_leader_id() returns uuid language sql stable security definer
set search_path = public as $$
  select id from profiles where auth_user_id = auth.uid() and status = 'active' $$;

create function public.get_current_cell_group_id() returns uuid language sql stable security definer
set search_path = public as $$
  select cg.id from cell_groups cg
  where cg.leader_id = get_current_leader_id() and cg.status = 'active' limit 1 $$;

create function public.can_access_disciple(d uuid) returns boolean language sql stable security definer
set search_path = public as $$
  select is_staff() or exists (
    select 1 from disciples where id = d and cell_group_id = get_current_cell_group_id()) $$;

-- ============ NEW USER -> PENDING LEADER PROFILE ============
-- Role/status are IGNORED from client metadata. Always pending leader.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (auth_user_id, email, first_name, last_name, role, status)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'first_name',''),
          coalesce(new.raw_user_meta_data->>'last_name',''),
          'leader', 'pending');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PROFILE PROTECTION (role/status cannot be self-edited) ============
-- auth.uid() is null for SQL Editor / service role, so bootstrap still works.
create function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.auth_user_id <> old.auth_user_id then raise exception 'auth_user_id is immutable'; end if;
  if new.role = old.role and new.status = old.status then return new; end if;
  if is_developer() then return new; end if;
  if is_pastor() and new.role = old.role and old.role = 'leader'
     and old.auth_user_id <> auth.uid() then
    return new;  -- pastors may approve/deactivate leaders only
  end if;
  raise exception 'Not allowed to change role or status';
end $$;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ============ AUDIT ============
create function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare act text; rid uuid; desc_ text;
begin
  rid := coalesce(new.id, old.id);
  if tg_table_name = 'profiles' then
    if tg_op = 'UPDATE' and new.role is distinct from old.role then
      act := 'role_changed'; desc_ := old.role || ' -> ' || new.role;
    elsif tg_op = 'INSERT' then act := 'user_created'; desc_ := new.email;
    else return coalesce(new, old); end if;
  elsif tg_table_name = 'disciples' and tg_op = 'UPDATE'
        and new.cell_group_id is distinct from old.cell_group_id then
    act := 'disciple_transferred'; desc_ := new.first_name || ' ' || new.last_name;
  else
    act := tg_table_name || '_' || lower(tg_op);
    desc_ := tg_table_name || ' ' || lower(tg_op);
  end if;
  insert into audit_logs(user_id, action, entity_type, entity_id, description)
  values (get_current_leader_id(), act, tg_table_name, rid, desc_);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','disciples','events','attendance',
    'checklist_categories','checklist_items','checklist_records'] loop
    execute format('create trigger trg_%s_audit after insert or update on public.%I
      for each row execute function public.audit_trigger()', t, t);
  end loop; end $$;

-- Client-callable logger (e.g. login). Only records as the caller.
create function public.log_event(p_action text, p_entity text default 'session', p_desc text default null)
returns void language sql security definer set search_path = public as $$
  insert into audit_logs(user_id, action, entity_type, description)
  select get_current_leader_id(), p_action, p_entity, p_desc
  where get_current_leader_id() is not null $$;

-- ============ CONVERT INVITEE -> DISCIPLE ============
create function public.convert_invitee_to_disciple(p_invitee uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare i invitees; new_id uuid; gid uuid; lid uuid;
begin
  select * into i from invitees where id = p_invitee;
  if not found then raise exception 'Invitee not found'; end if;
  if not (is_staff() or i.cell_group_id = get_current_cell_group_id()) then
    raise exception 'Not allowed';
  end if;
  if i.converted_disciple_id is not null then return i.converted_disciple_id; end if;
  gid := i.cell_group_id;
  select leader_id into lid from cell_groups where id = gid;
  insert into disciples(first_name,last_name,phone,email,address,cell_group_id,leader_id,invited_by,notes,status)
  values (i.first_name,i.last_name,i.phone,i.email,i.address,gid,lid,i.invited_by,i.notes,'new_disciple')
  returning id into new_id;
  update invitees set status='converted', converted_disciple_id=new_id where id = p_invitee;
  return new_id;
end $$;

-- ============ ROW LEVEL SECURITY ============
do $$ declare t text; begin
  foreach t in array array['profiles','cell_groups','disciples','invitees','event_types','events',
    'attendance','checklist_categories','checklist_items','checklist_records','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop; end $$;

-- profiles
create policy profiles_select on profiles for select to authenticated
  using (auth_user_id = auth.uid() or is_staff());
create policy profiles_update_self on profiles for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid()); -- trigger blocks role/status
create policy profiles_update_dev on profiles for update to authenticated
  using (is_developer()) with check (is_developer());
create policy profiles_update_pastor on profiles for update to authenticated
  using (is_pastor() and role = 'leader') with check (is_pastor() and role = 'leader');
create policy profiles_delete_dev on profiles for delete to authenticated using (is_developer());
-- No INSERT policy: profiles are created only by the auth trigger / service role.

-- cell_groups
create policy cg_staff on cell_groups for all to authenticated
  using (is_staff()) with check (is_staff());
create policy cg_leader_select on cell_groups for select to authenticated
  using (is_leader() and id = get_current_cell_group_id());

-- disciples (leaders can't move a disciple out of their own group: WITH CHECK)
create policy dis_staff on disciples for all to authenticated
  using (is_staff()) with check (is_staff());
create policy dis_leader_select on disciples for select to authenticated
  using (is_leader() and cell_group_id = get_current_cell_group_id());
create policy dis_leader_insert on disciples for insert to authenticated
  with check (is_leader() and cell_group_id = get_current_cell_group_id());
create policy dis_leader_update on disciples for update to authenticated
  using (is_leader() and cell_group_id = get_current_cell_group_id())
  with check (is_leader() and cell_group_id = get_current_cell_group_id());

-- invitees
create policy inv_staff on invitees for all to authenticated
  using (is_staff()) with check (is_staff());
create policy inv_leader_select on invitees for select to authenticated
  using (is_leader() and cell_group_id = get_current_cell_group_id());
create policy inv_leader_insert on invitees for insert to authenticated
  with check (is_leader() and cell_group_id = get_current_cell_group_id());
create policy inv_leader_update on invitees for update to authenticated
  using (is_leader() and cell_group_id = get_current_cell_group_id())
  with check (is_leader() and cell_group_id = get_current_cell_group_id());

-- event types, events, checklist definitions: everyone active reads; staff writes
create policy et_read on event_types for select to authenticated using (get_current_user_role() is not null);
create policy et_write on event_types for all to authenticated using (is_staff()) with check (is_staff());
create policy ev_read on events for select to authenticated using (get_current_user_role() is not null);
create policy ev_write on events for all to authenticated using (is_staff()) with check (is_staff());
create policy cc_read on checklist_categories for select to authenticated using (get_current_user_role() is not null);
create policy cc_write on checklist_categories for all to authenticated using (is_staff()) with check (is_staff());
create policy ci_read on checklist_items for select to authenticated using (get_current_user_role() is not null);
create policy ci_write on checklist_items for all to authenticated using (is_staff()) with check (is_staff());

-- attendance & checklist records: scoped through the disciple's group
create policy att_all on attendance for all to authenticated
  using (can_access_disciple(disciple_id)) with check (can_access_disciple(disciple_id));
create policy cr_all on checklist_records for all to authenticated
  using (can_access_disciple(disciple_id)) with check (can_access_disciple(disciple_id));

-- audit logs: developer all; pastor operational (not user/role admin); leaders none
create policy audit_dev on audit_logs for select to authenticated using (is_developer());
create policy audit_pastor on audit_logs for select to authenticated
  using (is_pastor() and entity_type <> 'profiles');
-- No INSERT/UPDATE/DELETE policies: written only by SECURITY DEFINER triggers/log_event.

-- Lock down function execution
revoke all on function public.convert_invitee_to_disciple(uuid) from public;
grant execute on function public.convert_invitee_to_disciple(uuid), public.log_event(text,text,text),
  public.get_current_user_role(), public.is_developer(), public.is_pastor(), public.is_leader(),
  public.get_current_leader_id(), public.get_current_cell_group_id() to authenticated;

-- ============ SEED (editable by staff later) ============
insert into event_types(name) values ('Sunday Service'),('Weekly Fellowship'),('Leadership Training'),
  ('Encounter'),('Outreach'),('Conference'),('Bible Study');

-- ============ BOOTSTRAP FIRST DEVELOPER ============
-- 1) Create your user in Authentication > Users (or sign up in the app).
-- 2) Then run this in the SQL Editor (it works because auth.uid() is null there):
--    update public.profiles set role='developer', status='active' where email='YOU@example.com';
