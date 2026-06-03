import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  CircleDashed,
  Dot,
  Eye,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { Priority, Status, Task } from "@/types";

const iconClassName = "h-3.5 w-3.5";

export const statusLabels: Record<Status, string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

export const priorityLabels: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

const priorityColor: Record<Priority, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#14b8a6",
  none: "var(--text-dim)",
};

export function StatusIcon({ status }: { status: Status }) {
  const props = { className: iconClassName, strokeWidth: 2 };

  switch (status) {
    case "backlog":
      return <CircleDashed {...props} />;
    case "todo":
      return <Circle {...props} />;
    case "in-progress":
      return <LoaderCircle {...props} />;
    case "in-review":
      return <Eye {...props} />;
    case "done":
      return <CheckCircle2 {...props} />;
    case "cancelled":
      return <XCircle {...props} />;
    default:
      return <Circle {...props} />;
  }
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  const color = priorityColor[priority];
  const props = { className: iconClassName, strokeWidth: 2, style: { color } };

  switch (priority) {
    case "urgent":
      return <AlertTriangle {...props} />;
    case "high":
      return <ArrowUp {...props} />;
    case "medium":
      return <Dot {...props} />;
    case "low":
      return <ArrowDown {...props} />;
    case "none":
      return <Dot {...props} />;
    default:
      return <Dot {...props} />;
  }
}

export function formatDueDate(dueDate?: string) {
  if (!dueDate) {
    return "";
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return dueDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export type DueDateFilter = "all" | "overdue" | "due-soon" | "no-date";

export type TaskFilters = {
  query: string;
  statuses: Status[];
  priorities: Priority[];
  assigneeIds: string[];
  dueDate: DueDateFilter;
};

export const emptyTaskFilters: TaskFilters = {
  query: "",
  statuses: [],
  priorities: [],
  assigneeIds: [],
  dueDate: "all",
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isDueDateMatch(dueDate: string | undefined, filter: DueDateFilter) {
  if (filter === "all") {
    return true;
  }

  if (!dueDate) {
    return filter === "no-date";
  }

  const parsed = startOfDay(new Date(dueDate));
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = startOfDay(new Date());
  const dueSoonLimit = new Date(today);
  dueSoonLimit.setDate(today.getDate() + 7);

  if (filter === "overdue") {
    return parsed < today;
  }

  return parsed >= today && parsed <= dueSoonLimit;
}

export function hasActiveTaskFilters(filters: TaskFilters) {
  return (
    filters.query.trim().length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.dueDate !== "all"
  );
}

export function matchesTaskFilters(task: Task, filters: TaskFilters) {
  const query = filters.query.trim().toLowerCase();
  const queryTarget = [
    task.identifier,
    task.title,
    task.description,
    ...task.labels,
  ]
    .join(" ")
    .toLowerCase();

  return (
    (!query || queryTarget.includes(query)) &&
    (!filters.statuses.length || filters.statuses.includes(task.status)) &&
    (!filters.priorities.length || filters.priorities.includes(task.priority)) &&
    (!filters.assigneeIds.length || filters.assigneeIds.includes(task.assignee?.id ?? "unassigned")) &&
    isDueDateMatch(task.dueDate, filters.dueDate)
  );
}

export function toggleFilterValue<T>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}
