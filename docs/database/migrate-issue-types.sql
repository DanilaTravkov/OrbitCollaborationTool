\set ON_ERROR_STOP on

begin;

create table if not exists public.issue_types (
  id text primary key,
  name text not null,
  sort_order integer not null
);

alter table public.issue_types enable row level security;

insert into public.issue_types (id, name, sort_order)
values
  ('subtask', 'Subtask', 10),
  ('subbug', 'Subbug', 20),
  ('task', 'Task', 30),
  ('bug', 'Bug', 40),
  ('user-story', 'User Story', 50),
  ('epic', 'Epic', 60)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

alter table public.issues
  add column if not exists issue_type_id text;

update public.issues
set issue_type_id = case identifier
  when 'ATL-001' then 'task'
  when 'ATL-002' then 'user-story'
  when 'ATL-003' then 'epic'
  when 'ATL-004' then 'task'
  when 'HRZ-001' then 'epic'
  when 'ATL-005' then 'user-story'
  when 'HRZ-002' then 'bug'
  when 'ATL-006' then 'subtask'
  when 'ATL-007' then 'task'
  when 'NUC-001' then 'task'
  when 'NUC-002' then 'user-story'
  when 'HRZ-003' then 'subbug'
  else 'task'
end
where issue_type_id is null
   or issue_type_id not in (select id from public.issue_types);

alter table public.issues
  alter column issue_type_id set default 'task',
  alter column issue_type_id set not null;

alter table public.issues
  drop constraint if exists issues_issue_type_id_fkey;

alter table public.issues
  add constraint issues_issue_type_id_fkey
  foreign key (issue_type_id) references public.issue_types(id);

commit;

notify pgrst, 'reload schema';

select issue_type_id, count(*) as issue_count
from public.issues
group by issue_type_id
order by issue_type_id;
