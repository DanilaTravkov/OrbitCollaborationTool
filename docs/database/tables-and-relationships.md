# Orbit Database Tables and CSV Seed Data

This folder describes the app entities for a Supabase/Postgres backend and provides CSV-style seed data in `docs/database/seed`.

Users are intentionally excluded from public tables. They live in Supabase Auth (`auth.users`) and are created with these email/password pairs:

id,email,password,created_at
1,lena.brooks@example.com,OrbitDemo#2026-LB,2026-06-13 18:12:47.051775+00
2,sam.chen@example.com,OrbitDemo#2026-SC,2026-06-13 18:12:47.051775+00
3,jordan.lee@example.com,OrbitDemo#2026-JL,2026-06-13 18:12:47.051775+00
4,morgan.davis@example.com,OrbitDemo#2026-MD,2026-06-13 18:12:47.051775+00
5,alex.kim@example.com,OrbitDemo#2026-AK,2026-06-13 18:12:47.051775+00

## Tables

| Table | Purpose |
| --- | --- |
| `workspaces` | Top-level workspace/account container. |
| `workspace_members` | Many-to-many relationship between workspaces and existing users. |
| `projects` | Issue projects such as Atlas, Horizon, and Nucleus. |
| `project_members` | Many-to-many relationship between projects and existing users. |
| `issue_statuses` | Ordered issue status lookup values. |
| `issue_priorities` | Ordered issue priority lookup values. |
| `issue_types` | Ordered issue type lookup values. |
| `issues` | Main task/issue records. |
| `labels` | Workspace-scoped reusable issue labels. |
| `issue_labels` | Many-to-many relationship between issues and labels. |
| `issue_links` | Many-to-many self-relationship between issues. |
| `issue_comments` | Comments/activity entries on issues. |

## Foreign Key Relationships

| From | To |
| --- | --- |
| `workspaces.created_by_user_id` | existing `auth.users.id` |
| `workspace_members.workspace_id` | `workspaces.id` |
| `workspace_members.user_id` | existing `auth.users.id` |
| `projects.workspace_id` | `workspaces.id` |
| `project_members.project_id` | `projects.id` |
| `project_members.user_id` | existing `auth.users.id` |
| `issues.project_id` | `projects.id` |
| `issues.status_id` | `issue_statuses.id` |
| `issues.priority_id` | `issue_priorities.id` |
| `issues.issue_type_id` | `issue_types.id` |
| `issues.reporter_user_id` | existing `auth.users.id` |
| `issues.assignee_user_id` | existing `auth.users.id`, nullable |
| `labels.workspace_id` | `workspaces.id` |
| `issue_labels.issue_id` | `issues.id` |
| `issue_labels.label_id` | `labels.id` |
| `issue_links.source_issue_id` | `issues.id` |
| `issue_links.target_issue_id` | `issues.id` |
| `issue_comments.issue_id` | `issues.id` |
| `issue_comments.author_user_id` | existing `auth.users.id` |

## Suggested Constraints

- `workspaces.slug` unique.
- `workspace_members` unique on `(workspace_id, user_id)`.
- `projects` unique on `(workspace_id, key)`.
- `project_members` unique on `(project_id, user_id)`.
- `issue_statuses` unique on `id`.
- `issue_priorities` unique on `id`.
- `issue_types` unique on `id`.
- `issues.identifier` unique.
- `labels` unique on `(workspace_id, name)`.
- `issue_labels` unique on `(issue_id, label_id)`.
- `issue_links` unique on `(source_issue_id, target_issue_id, relationship)`.
