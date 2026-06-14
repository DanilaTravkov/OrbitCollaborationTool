\set ON_ERROR_STOP on

select format_type(attribute.atttypid, attribute.atttypmod) as user_id_type
from pg_attribute attribute
join pg_class class on class.oid = attribute.attrelid
join pg_namespace namespace on namespace.oid = class.relnamespace
where namespace.nspname = 'auth'
  and class.relname = 'users'
  and attribute.attname = 'id'
  and not attribute.attisdropped
\gset

\if :{?user_id_type}
\else
  \echo 'Expected auth.users(id) to exist before creating Orbit tables.'
  \quit 1
\endif

begin;

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_by_user_id :user_id_type not null references auth.users(id),
  created_at timestamptz not null
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id :user_id_type not null references auth.users(id),
  role text not null,
  joined_at timestamptz not null,
  primary key (workspace_id, user_id)
);

create table if not exists public.projects (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  name text not null,
  key text not null,
  color text not null,
  created_at timestamptz not null,
  archived_at timestamptz,
  unique (workspace_id, key)
);

create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id :user_id_type not null references auth.users(id),
  role text not null,
  joined_at timestamptz not null,
  primary key (project_id, user_id)
);

create table if not exists public.issue_statuses (
  id text primary key,
  name text not null,
  sort_order integer not null,
  is_terminal boolean not null
);

create table if not exists public.issue_priorities (
  id text primary key,
  name text not null,
  sort_order integer not null
);

create table if not exists public.issue_types (
  id text primary key,
  name text not null,
  sort_order integer not null
);

create table if not exists public.issues (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  identifier text not null unique,
  title text not null,
  description text not null,
  status_id text not null references public.issue_statuses(id),
  priority_id text not null references public.issue_priorities(id),
  issue_type_id text not null default 'task' references public.issue_types(id),
  reporter_user_id :user_id_type not null references auth.users(id),
  assignee_user_id :user_id_type references auth.users(id),
  due_date date,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.labels (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null,
  unique (workspace_id, name)
);

create table if not exists public.issue_labels (
  issue_id text not null references public.issues(id) on delete cascade,
  label_id text not null references public.labels(id) on delete cascade,
  primary key (issue_id, label_id)
);

create table if not exists public.issue_links (
  source_issue_id text not null references public.issues(id) on delete cascade,
  target_issue_id text not null references public.issues(id) on delete cascade,
  relationship text not null,
  created_at timestamptz not null,
  primary key (source_issue_id, target_issue_id, relationship),
  check (source_issue_id <> target_issue_id)
);

create table if not exists public.issue_comments (
  id text primary key,
  issue_id text not null references public.issues(id) on delete cascade,
  author_user_id :user_id_type not null references auth.users(id),
  body text not null,
  created_at timestamptz not null
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.issue_statuses enable row level security;
alter table public.issue_priorities enable row level security;
alter table public.issue_types enable row level security;
alter table public.issues enable row level security;
alter table public.labels enable row level security;
alter table public.issue_labels enable row level security;
alter table public.issue_links enable row level security;
alter table public.issue_comments enable row level security;

create temp table seed_user_aliases (
  raw_user_id text primary key,
  normalized_user_id text not null
) on commit drop;

insert into seed_user_aliases (raw_user_id, normalized_user_id)
select raw_user_id, auth_users.id::text
from (
  values
    ('1', 'lena.brooks@example.com'),
    ('2', 'sam.chen@example.com'),
    ('3', 'jordan.lee@example.com'),
    ('4', 'morgan.davis@example.com'),
    ('5', 'alex.kim@example.com'),
    ('user_lena_brooks', 'lena.brooks@example.com'),
    ('user_sam_chen', 'sam.chen@example.com'),
    ('user_jordan_lee', 'jordan.lee@example.com'),
    ('user_morgan_davis', 'morgan.davis@example.com'),
    ('user_alex_kim', 'alex.kim@example.com')
) as seed_users(raw_user_id, email)
join auth.users as auth_users on lower(auth_users.email) = seed_users.email;

create temp table seed_workspaces (
  id text,
  name text,
  slug text,
  created_by_user_id text,
  created_at text
) on commit drop;

create temp table seed_workspace_members (
  workspace_id text,
  user_id text,
  role text,
  joined_at text
) on commit drop;

create temp table seed_projects (
  id text,
  workspace_id text,
  name text,
  key text,
  color text,
  created_at text,
  archived_at text
) on commit drop;

create temp table seed_project_members (
  project_id text,
  user_id text,
  role text,
  joined_at text
) on commit drop;

create temp table seed_issue_statuses (
  id text,
  name text,
  sort_order text,
  is_terminal text
) on commit drop;

create temp table seed_issue_priorities (
  id text,
  name text,
  sort_order text
) on commit drop;

create temp table seed_issue_types (
  id text,
  name text,
  sort_order text
) on commit drop;

create temp table seed_issues (
  id text,
  project_id text,
  identifier text,
  title text,
  description text,
  status_id text,
  priority_id text,
  issue_type_id text,
  reporter_user_id text,
  assignee_user_id text,
  due_date text,
  created_at text,
  updated_at text
) on commit drop;

create temp table seed_labels (
  id text,
  workspace_id text,
  name text,
  color text
) on commit drop;

create temp table seed_issue_labels (
  issue_id text,
  label_id text
) on commit drop;

create temp table seed_issue_links (
  source_issue_id text,
  target_issue_id text,
  relationship text,
  created_at text
) on commit drop;

create temp table seed_issue_comments (
  id text,
  issue_id text,
  author_user_id text,
  body text,
  created_at text
) on commit drop;

\copy seed_workspaces from 'docs/database/seed/workspaces.csv' with (format csv, header true)
\copy seed_workspace_members from 'docs/database/seed/workspace_members.csv' with (format csv, header true)
\copy seed_projects from 'docs/database/seed/projects.csv' with (format csv, header true)
\copy seed_project_members from 'docs/database/seed/project_members.csv' with (format csv, header true)
\copy seed_issue_statuses from 'docs/database/seed/issue_statuses.csv' with (format csv, header true)
\copy seed_issue_priorities from 'docs/database/seed/issue_priorities.csv' with (format csv, header true)
\copy seed_issue_types from 'docs/database/seed/issue_types.csv' with (format csv, header true)
\copy seed_issues from 'docs/database/seed/issues.csv' with (format csv, header true)
\copy seed_labels from 'docs/database/seed/labels.csv' with (format csv, header true)
\copy seed_issue_labels from 'docs/database/seed/issue_labels.csv' with (format csv, header true)
\copy seed_issue_links from 'docs/database/seed/issue_links.csv' with (format csv, header true)
\copy seed_issue_comments from 'docs/database/seed/issue_comments.csv' with (format csv, header true)

insert into public.workspaces (id, name, slug, created_by_user_id, created_at)
select
  seed_workspaces.id,
  seed_workspaces.name,
  seed_workspaces.slug,
  cast(coalesce(seed_user_aliases.normalized_user_id, seed_workspaces.created_by_user_id) as :user_id_type),
  seed_workspaces.created_at::timestamptz
from seed_workspaces
left join seed_user_aliases on seed_user_aliases.raw_user_id = seed_workspaces.created_by_user_id
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  created_by_user_id = excluded.created_by_user_id,
  created_at = excluded.created_at;

insert into public.workspace_members (workspace_id, user_id, role, joined_at)
select
  seed_workspace_members.workspace_id,
  cast(coalesce(seed_user_aliases.normalized_user_id, seed_workspace_members.user_id) as :user_id_type),
  seed_workspace_members.role,
  seed_workspace_members.joined_at::timestamptz
from seed_workspace_members
left join seed_user_aliases on seed_user_aliases.raw_user_id = seed_workspace_members.user_id
on conflict (workspace_id, user_id) do update set
  role = excluded.role,
  joined_at = excluded.joined_at;

insert into public.projects (id, workspace_id, name, key, color, created_at, archived_at)
select id, workspace_id, name, key, color, created_at::timestamptz, nullif(archived_at, '')::timestamptz
from seed_projects
on conflict (id) do update set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  key = excluded.key,
  color = excluded.color,
  created_at = excluded.created_at,
  archived_at = excluded.archived_at;

insert into public.project_members (project_id, user_id, role, joined_at)
select
  seed_project_members.project_id,
  cast(coalesce(seed_user_aliases.normalized_user_id, seed_project_members.user_id) as :user_id_type),
  seed_project_members.role,
  seed_project_members.joined_at::timestamptz
from seed_project_members
left join seed_user_aliases on seed_user_aliases.raw_user_id = seed_project_members.user_id
on conflict (project_id, user_id) do update set
  role = excluded.role,
  joined_at = excluded.joined_at;

insert into public.issue_statuses (id, name, sort_order, is_terminal)
select id, name, sort_order::integer, is_terminal::boolean
from seed_issue_statuses
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal;

insert into public.issue_priorities (id, name, sort_order)
select id, name, sort_order::integer
from seed_issue_priorities
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.issue_types (id, name, sort_order)
select id, name, sort_order::integer
from seed_issue_types
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.issues (
  id,
  project_id,
  identifier,
  title,
  description,
  status_id,
  priority_id,
  issue_type_id,
  reporter_user_id,
  assignee_user_id,
  due_date,
  created_at,
  updated_at
)
select
  id,
  project_id,
  identifier,
  title,
  description,
  status_id,
  priority_id,
  issue_type_id,
  cast(coalesce(reporter_alias.normalized_user_id, seed_issues.reporter_user_id) as :user_id_type),
  case
    when nullif(seed_issues.assignee_user_id, '') is null then null
    else cast(coalesce(assignee_alias.normalized_user_id, seed_issues.assignee_user_id) as :user_id_type)
  end,
  nullif(due_date, '')::date,
  created_at::timestamptz,
  updated_at::timestamptz
from seed_issues
left join seed_user_aliases as reporter_alias on reporter_alias.raw_user_id = seed_issues.reporter_user_id
left join seed_user_aliases as assignee_alias on assignee_alias.raw_user_id = seed_issues.assignee_user_id
on conflict (id) do update set
  project_id = excluded.project_id,
  identifier = excluded.identifier,
  title = excluded.title,
  description = excluded.description,
  status_id = excluded.status_id,
  priority_id = excluded.priority_id,
  issue_type_id = excluded.issue_type_id,
  reporter_user_id = excluded.reporter_user_id,
  assignee_user_id = excluded.assignee_user_id,
  due_date = excluded.due_date,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.labels (id, workspace_id, name, color)
select id, workspace_id, name, color
from seed_labels
on conflict (id) do update set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  color = excluded.color;

insert into public.issue_labels (issue_id, label_id)
select issue_id, label_id
from seed_issue_labels
on conflict (issue_id, label_id) do nothing;

insert into public.issue_links (source_issue_id, target_issue_id, relationship, created_at)
select source_issue_id, target_issue_id, relationship, created_at::timestamptz
from seed_issue_links
on conflict (source_issue_id, target_issue_id, relationship) do update set
  created_at = excluded.created_at;

insert into public.issue_comments (id, issue_id, author_user_id, body, created_at)
select
  seed_issue_comments.id,
  seed_issue_comments.issue_id,
  cast(coalesce(seed_user_aliases.normalized_user_id, seed_issue_comments.author_user_id) as :user_id_type),
  seed_issue_comments.body,
  seed_issue_comments.created_at::timestamptz
from seed_issue_comments
left join seed_user_aliases on seed_user_aliases.raw_user_id = seed_issue_comments.author_user_id
on conflict (id) do update set
  issue_id = excluded.issue_id,
  author_user_id = excluded.author_user_id,
  body = excluded.body,
  created_at = excluded.created_at;

commit;

select 'workspaces' as table_name, count(*) as row_count from public.workspaces
union all select 'workspace_members', count(*) from public.workspace_members
union all select 'projects', count(*) from public.projects
union all select 'project_members', count(*) from public.project_members
union all select 'issue_statuses', count(*) from public.issue_statuses
union all select 'issue_priorities', count(*) from public.issue_priorities
union all select 'issue_types', count(*) from public.issue_types
union all select 'issues', count(*) from public.issues
union all select 'labels', count(*) from public.labels
union all select 'issue_labels', count(*) from public.issue_labels
union all select 'issue_links', count(*) from public.issue_links
union all select 'issue_comments', count(*) from public.issue_comments
order by table_name;
