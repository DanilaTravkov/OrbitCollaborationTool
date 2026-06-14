import { TASKS } from "@/data";
import { ISSUE_TYPE_ORDER, STATUS_ORDER } from "@/types";
import type { Assignee, IssueType, Priority, Status, Task, TaskComment } from "@/types";
import { emptyTaskFilters } from "@/lib/task-utils";
import type { DueDateFilter, TaskFilters } from "@/lib/task-utils";

const STORAGE_KEY = "orbit.workspace.v1";
const dueDateFilters: DueDateFilter[] = ["all", "overdue", "due-soon", "no-date"];
const priorities: Priority[] = ["urgent", "high", "medium", "low", "none"];

export type TaskViewMode = "list" | "board";
export type TaskScope = "all" | "mine";

export type WorkspacePreferences = {
  selectedProjectId: string;
  selectedTaskId: string | null;
  viewMode: TaskViewMode;
  scope: TaskScope;
  filters: TaskFilters;
};

export type WorkspaceState = {
  tasks: Task[];
  preferences: WorkspacePreferences;
};

const defaultPreferences: WorkspacePreferences = {
  selectedProjectId: "all",
  selectedTaskId: TASKS[0]?.id ?? null,
  viewMode: "list",
  scope: "all",
  filters: emptyTaskFilters,
};

export const defaultWorkspaceState: WorkspaceState = {
  tasks: TASKS,
  preferences: defaultPreferences,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isStatus(value: unknown): value is Status {
  return isString(value) && STATUS_ORDER.includes(value as Status);
}

function isPriority(value: unknown): value is Priority {
  return isString(value) && priorities.includes(value as Priority);
}

function isIssueType(value: unknown): value is IssueType {
  return isString(value) && ISSUE_TYPE_ORDER.includes(value as IssueType);
}

function isAssignee(value: unknown): value is Assignee {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.initials) &&
    isString(value.color)
  );
}

function isTaskComment(value: unknown): value is TaskComment {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.body) &&
    isAssignee(value.author) &&
    isString(value.createdAt)
  );
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  const assignee = value.assignee;
  const linkedIssueIds = value.linkedIssueIds;
  const comments = value.comments;

  return (
    isString(value.id) &&
    isString(value.identifier) &&
    isString(value.title) &&
    isString(value.description) &&
    isStatus(value.status) &&
    isPriority(value.priority) &&
    (value.issueType === undefined || isIssueType(value.issueType)) &&
    (assignee === null || isAssignee(assignee)) &&
    isStringArray(value.labels) &&
    (linkedIssueIds === undefined || isStringArray(linkedIssueIds)) &&
    (comments === undefined || (Array.isArray(comments) && comments.every(isTaskComment))) &&
    (value.dueDate === undefined || isString(value.dueDate)) &&
    isString(value.createdAt) &&
    isString(value.projectId)
  );
}

function readTasks(value: unknown) {
  if (!Array.isArray(value) || !value.every(isTask)) {
    return defaultWorkspaceState.tasks;
  }

  return value.map((task) => ({
    ...task,
    issueType: task.issueType ?? "task",
  }));
}

function readFilters(value: unknown): TaskFilters {
  if (!isRecord(value)) {
    return emptyTaskFilters;
  }

  return {
    query: isString(value.query) ? value.query : "",
    statuses: Array.isArray(value.statuses) ? value.statuses.filter(isStatus) : [],
    priorities: Array.isArray(value.priorities) ? value.priorities.filter(isPriority) : [],
    issueTypes: Array.isArray(value.issueTypes) ? value.issueTypes.filter(isIssueType) : [],
    assigneeIds: isStringArray(value.assigneeIds) ? value.assigneeIds : [],
    dueDate: isString(value.dueDate) && dueDateFilters.includes(value.dueDate as DueDateFilter)
      ? (value.dueDate as DueDateFilter)
      : "all",
  };
}

function readPreferences(value: unknown, tasks: Task[]): WorkspacePreferences {
  if (!isRecord(value)) {
    return {
      ...defaultPreferences,
      selectedTaskId: tasks[0]?.id ?? null,
    };
  }

  const selectedTaskId = isString(value.selectedTaskId) ? value.selectedTaskId : null;
  const taskExists = selectedTaskId ? tasks.some((task) => task.id === selectedTaskId) : false;

  return {
    selectedProjectId: isString(value.selectedProjectId) ? value.selectedProjectId : "all",
    selectedTaskId: taskExists ? selectedTaskId : null,
    viewMode: value.viewMode === "board" ? "board" : "list",
    scope: value.scope === "mine" ? "mine" : "all",
    filters: readFilters(value.filters),
  };
}

export function readWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return defaultWorkspaceState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultWorkspaceState;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return defaultWorkspaceState;
    }

    const tasks = readTasks(parsed.tasks);

    return {
      tasks,
      preferences: readPreferences(parsed.preferences, tasks),
    };
  } catch {
    return defaultWorkspaceState;
  }
}

export function writeWorkspaceState(state: WorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail in private browsing or quota-constrained environments.
  }
}

export function readStoredTasks() {
  return readWorkspaceState().tasks;
}
