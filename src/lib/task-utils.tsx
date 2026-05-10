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
import { Priority, Status } from "@/types";

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