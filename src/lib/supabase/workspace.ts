import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createAuthSession } from "@/lib/auth-storage";
import type { WorkspaceSnapshot } from "@/lib/api/workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { Assignee, IssueType, Priority, Project, Status, Task, TaskComment } from "@/types";

type PublicTables = Database["public"]["Tables"];
type PublicViews = Database["public"]["Views"];
type AuthUserProfileRow = PublicViews["auth_user_profiles"]["Row"];
type ProjectRow = PublicTables["projects"]["Row"];
type IssueRow = PublicTables["issues"]["Row"];
type IssueStatusRow = PublicTables["issue_statuses"]["Row"];
type IssuePriorityRow = PublicTables["issue_priorities"]["Row"];
type IssueTypeRow = PublicTables["issue_types"]["Row"];
type IssueLabelRow = PublicTables["issue_labels"]["Row"];
type LabelRow = PublicTables["labels"]["Row"];
type IssueLinkRow = PublicTables["issue_links"]["Row"];
type IssueCommentRow = PublicTables["issue_comments"]["Row"];

type OrbitSupabaseClient = SupabaseClient<Database>;

function throwIfError(error: PostgrestError | null, label: string) {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

function assigneeFromUser(user: AuthUserProfileRow): Assignee {
  const session = createAuthSession(user.email ?? user.id, {
    id: user.id,
    createdAt: user.created_at,
  });

  return {
    id: session.id,
    name: session.name,
    initials: session.initials,
    color: session.color,
  };
}

function buildLookup<T extends { id: string | number }>(rows: T[]) {
  return new Map(rows.map((row) => [String(row.id), row]));
}

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Map<string, T[]>>((groups, row) => {
    const key = getKey(row);
    const current = groups.get(key);

    if (current) {
      current.push(row);
    } else {
      groups.set(key, [row]);
    }

    return groups;
  }, new Map());
}

async function fetchOrbitTables(supabase: OrbitSupabaseClient) {
  const [
    users,
    projects,
    statuses,
    priorities,
    issueTypes,
    issues,
    labels,
    issueLabels,
    issueLinks,
    issueComments,
  ] = await Promise.all([
    supabase.from("auth_user_profiles").select("id,email,created_at").order("created_at", { ascending: true }),
    supabase.from("projects").select("*").is("archived_at", null).order("created_at", { ascending: true }),
    supabase.from("issue_statuses").select("*").order("sort_order", { ascending: true }),
    supabase.from("issue_priorities").select("*").order("sort_order", { ascending: true }),
    supabase.from("issue_types").select("*").order("sort_order", { ascending: true }),
    supabase.from("issues").select("*").order("created_at", { ascending: true }),
    supabase.from("labels").select("*").order("name", { ascending: true }),
    supabase.from("issue_labels").select("*"),
    supabase.from("issue_links").select("*").order("created_at", { ascending: true }),
    supabase.from("issue_comments").select("*").order("created_at", { ascending: true }),
  ]);

  throwIfError(users.error, "Failed to load auth user profiles");
  throwIfError(projects.error, "Failed to load projects");
  throwIfError(statuses.error, "Failed to load issue statuses");
  throwIfError(priorities.error, "Failed to load issue priorities");
  throwIfError(issueTypes.error, "Failed to load issue types");
  throwIfError(issues.error, "Failed to load issues");
  throwIfError(labels.error, "Failed to load labels");
  throwIfError(issueLabels.error, "Failed to load issue labels");
  throwIfError(issueLinks.error, "Failed to load issue links");
  throwIfError(issueComments.error, "Failed to load issue comments");

  return {
    users: users.data ?? [],
    projects: projects.data ?? [],
    statuses: statuses.data ?? [],
    priorities: priorities.data ?? [],
    issueTypes: issueTypes.data ?? [],
    issues: issues.data ?? [],
    labels: labels.data ?? [],
    issueLabels: issueLabels.data ?? [],
    issueLinks: issueLinks.data ?? [],
    issueComments: issueComments.data ?? [],
  };
}

function mapProjects(projects: ProjectRow[]): Project[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    identifier: project.key,
    color: project.color,
  }));
}

function mapComments(
  comments: IssueCommentRow[] | undefined,
  assigneesByUserId: Map<string, Assignee>
): TaskComment[] {
  return (comments ?? []).map((comment) => ({
    id: comment.id,
    body: comment.body,
    author: assigneesByUserId.get(String(comment.author_user_id)) ?? {
      id: String(comment.author_user_id),
      name: `User ${comment.author_user_id}`,
      initials: "U",
      color: "#64748b",
    },
    createdAt: comment.created_at,
  }));
}

function mapTasks({
  issues,
  statuses,
  priorities,
  issueTypes,
  labels,
  issueLabels,
  issueLinks,
  issueComments,
  assigneesByUserId,
}: {
  issues: IssueRow[];
  statuses: IssueStatusRow[];
  priorities: IssuePriorityRow[];
  issueTypes: IssueTypeRow[];
  labels: LabelRow[];
  issueLabels: IssueLabelRow[];
  issueLinks: IssueLinkRow[];
  issueComments: IssueCommentRow[];
  assigneesByUserId: Map<string, Assignee>;
}): Task[] {
  const statusesById = buildLookup(statuses);
  const prioritiesById = buildLookup(priorities);
  const issueTypesById = buildLookup(issueTypes);
  const labelsById = buildLookup(labels);
  const labelsByIssueId = groupBy(issueLabels, (row) => row.issue_id);
  const linksByIssueId = groupBy(issueLinks, (row) => row.source_issue_id);
  const commentsByIssueId = groupBy(issueComments, (row) => row.issue_id);

  return issues.map((issue) => {
    const labelsForIssue = (labelsByIssueId.get(issue.id) ?? [])
      .map((entry) => labelsById.get(entry.label_id)?.name)
      .filter((label): label is string => Boolean(label));
    const linkedIssueIds = (linksByIssueId.get(issue.id) ?? []).map((entry) => entry.target_issue_id);
    const comments = mapComments(commentsByIssueId.get(issue.id), assigneesByUserId);

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      status: (statusesById.get(issue.status_id)?.id ?? issue.status_id) as Status,
      priority: (prioritiesById.get(issue.priority_id)?.id ?? issue.priority_id) as Priority,
      issueType: (issueTypesById.get(issue.issue_type_id)?.id ?? issue.issue_type_id) as IssueType,
      assignee: issue.assignee_user_id ? assigneesByUserId.get(String(issue.assignee_user_id)) ?? null : null,
      labels: labelsForIssue,
      linkedIssueIds,
      comments,
      dueDate: issue.due_date ?? undefined,
      createdAt: issue.created_at,
      projectId: issue.project_id,
    };
  });
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const supabase = createSupabaseAdminClient();
  const tables = await fetchOrbitTables(supabase);
  const assignees = tables.users.map(assigneeFromUser);
  const assigneesByUserId = new Map(assignees.map((assignee) => [assignee.id, assignee]));

  return {
    assignees,
    projects: mapProjects(tables.projects),
    tasks: mapTasks({
      issues: tables.issues,
      statuses: tables.statuses,
      priorities: tables.priorities,
      issueTypes: tables.issueTypes,
      labels: tables.labels,
      issueLabels: tables.issueLabels,
      issueLinks: tables.issueLinks,
      issueComments: tables.issueComments,
      assigneesByUserId,
    }),
  };
}
