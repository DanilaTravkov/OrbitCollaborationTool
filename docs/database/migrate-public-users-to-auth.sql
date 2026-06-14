\set ON_ERROR_STOP on

begin;

do $$
begin
  if to_regclass('auth.users') is null then
    raise exception 'Supabase Auth table auth.users does not exist. Enable Supabase Auth before running this migration.';
  end if;

  if to_regclass('auth.identities') is null then
    raise exception 'Supabase Auth table auth.identities does not exist. Enable Supabase Auth before running this migration.';
  end if;

  if to_regclass('public.users') is null then
    raise exception 'public.users does not exist, so there is no legacy user data to migrate.';
  end if;
end $$;

create temp table orbit_user_migration on commit drop as
select
  public_users.id as legacy_user_id,
  public_users.email,
  public_users.password,
  public_users.created_at,
  coalesce(auth_users.id, extensions.gen_random_uuid()) as auth_user_id
from public.users as public_users
left join auth.users as auth_users on lower(auth_users.email) = lower(public_users.email);

do $$
begin
  if exists (select 1 from orbit_user_migration where password is null or password = '') then
    raise exception 'Every public.users row must have a password before it can be migrated to Supabase Auth.';
  end if;
end $$;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  auth_user_id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt(password, extensions.gen_salt('bf')),
  created_at,
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  0,
  '',
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('orbit_legacy_user_id', legacy_user_id),
  false,
  created_at,
  created_at,
  false,
  false
from orbit_user_migration
on conflict (id) do update set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  email_change_token_current = excluded.email_change_token_current,
  email_change_confirm_status = excluded.email_change_confirm_status,
  reauthentication_token = excluded.reauthentication_token,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now(),
  is_sso_user = false,
  is_anonymous = false;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  auth_user_id,
  auth_user_id,
  auth_user_id::text,
  jsonb_build_object(
    'sub', auth_user_id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  created_at,
  created_at,
  created_at
from orbit_user_migration
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

alter table public.workspaces drop constraint if exists workspaces_created_by_user_id_fkey;
alter table public.workspace_members drop constraint if exists workspace_members_user_id_fkey;
alter table public.project_members drop constraint if exists project_members_user_id_fkey;
alter table public.issues drop constraint if exists issues_reporter_user_id_fkey;
alter table public.issues drop constraint if exists issues_assignee_user_id_fkey;
alter table public.issue_comments drop constraint if exists issue_comments_author_user_id_fkey;

alter table public.workspace_members drop constraint if exists workspace_members_pkey;
alter table public.project_members drop constraint if exists project_members_pkey;

alter table public.workspaces add column created_by_user_id_auth uuid;
update public.workspaces
set created_by_user_id_auth = orbit_user_migration.auth_user_id
from orbit_user_migration
where workspaces.created_by_user_id = orbit_user_migration.legacy_user_id;

do $$
begin
  if exists (select 1 from public.workspaces where created_by_user_id_auth is null) then
    raise exception 'Could not map every workspaces.created_by_user_id value to auth.users.';
  end if;
end $$;

alter table public.workspaces drop column created_by_user_id;
alter table public.workspaces rename column created_by_user_id_auth to created_by_user_id;
alter table public.workspaces alter column created_by_user_id set not null;
alter table public.workspaces
  add constraint workspaces_created_by_user_id_fkey
  foreign key (created_by_user_id) references auth.users(id);

alter table public.workspace_members add column user_id_auth uuid;
update public.workspace_members
set user_id_auth = orbit_user_migration.auth_user_id
from orbit_user_migration
where workspace_members.user_id = orbit_user_migration.legacy_user_id;

do $$
begin
  if exists (select 1 from public.workspace_members where user_id_auth is null) then
    raise exception 'Could not map every workspace_members.user_id value to auth.users.';
  end if;
end $$;

alter table public.workspace_members drop column user_id;
alter table public.workspace_members rename column user_id_auth to user_id;
alter table public.workspace_members alter column user_id set not null;
alter table public.workspace_members add primary key (workspace_id, user_id);
alter table public.workspace_members
  add constraint workspace_members_user_id_fkey
  foreign key (user_id) references auth.users(id);

alter table public.project_members add column user_id_auth uuid;
update public.project_members
set user_id_auth = orbit_user_migration.auth_user_id
from orbit_user_migration
where project_members.user_id = orbit_user_migration.legacy_user_id;

do $$
begin
  if exists (select 1 from public.project_members where user_id_auth is null) then
    raise exception 'Could not map every project_members.user_id value to auth.users.';
  end if;
end $$;

alter table public.project_members drop column user_id;
alter table public.project_members rename column user_id_auth to user_id;
alter table public.project_members alter column user_id set not null;
alter table public.project_members add primary key (project_id, user_id);
alter table public.project_members
  add constraint project_members_user_id_fkey
  foreign key (user_id) references auth.users(id);

alter table public.issues add column reporter_user_id_auth uuid;
alter table public.issues add column assignee_user_id_auth uuid;
update public.issues
set reporter_user_id_auth = reporter_map.auth_user_id
from orbit_user_migration as reporter_map
where issues.reporter_user_id = reporter_map.legacy_user_id;
update public.issues
set assignee_user_id_auth = assignee_map.auth_user_id
from orbit_user_migration as assignee_map
where issues.assignee_user_id = assignee_map.legacy_user_id;

do $$
begin
  if exists (select 1 from public.issues where reporter_user_id_auth is null) then
    raise exception 'Could not map every issues.reporter_user_id value to auth.users.';
  end if;

  if exists (select 1 from public.issues where assignee_user_id is not null and assignee_user_id_auth is null) then
    raise exception 'Could not map every non-null issues.assignee_user_id value to auth.users.';
  end if;
end $$;

alter table public.issues drop column reporter_user_id;
alter table public.issues drop column assignee_user_id;
alter table public.issues rename column reporter_user_id_auth to reporter_user_id;
alter table public.issues rename column assignee_user_id_auth to assignee_user_id;
alter table public.issues alter column reporter_user_id set not null;
alter table public.issues
  add constraint issues_reporter_user_id_fkey
  foreign key (reporter_user_id) references auth.users(id);
alter table public.issues
  add constraint issues_assignee_user_id_fkey
  foreign key (assignee_user_id) references auth.users(id);

alter table public.issue_comments add column author_user_id_auth uuid;
update public.issue_comments
set author_user_id_auth = orbit_user_migration.auth_user_id
from orbit_user_migration
where issue_comments.author_user_id = orbit_user_migration.legacy_user_id;

do $$
begin
  if exists (select 1 from public.issue_comments where author_user_id_auth is null) then
    raise exception 'Could not map every issue_comments.author_user_id value to auth.users.';
  end if;
end $$;

alter table public.issue_comments drop column author_user_id;
alter table public.issue_comments rename column author_user_id_auth to author_user_id;
alter table public.issue_comments alter column author_user_id set not null;
alter table public.issue_comments
  add constraint issue_comments_author_user_id_fkey
  foreign key (author_user_id) references auth.users(id);

drop table public.users;

create or replace view public.auth_user_profiles
with (security_invoker = false)
as
select id, email, created_at
from auth.users
where deleted_at is null
  and is_anonymous = false;

revoke all on public.auth_user_profiles from anon, authenticated;

commit;

select
  'auth.users' as table_name,
  count(*) filter (where email in (
    'lena.brooks@example.com',
    'sam.chen@example.com',
    'jordan.lee@example.com',
    'morgan.davis@example.com',
    'alex.kim@example.com'
  )) as migrated_rows
from auth.users;

select
  table_name,
  column_name,
  data_type,
  udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('workspaces', 'workspace_members', 'project_members', 'issues', 'issue_comments')
  and column_name in ('created_by_user_id', 'user_id', 'reporter_user_id', 'assignee_user_id', 'author_user_id')
order by table_name, column_name;
