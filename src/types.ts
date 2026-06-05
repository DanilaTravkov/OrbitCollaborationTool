export type Status =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "cancelled";

export type Priority = "urgent" | "high" | "medium" | "low" | "none";

export type Assignee = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type TaskComment = {
  id: string;
  body: string;
  author: Assignee;
  createdAt: string;
};

export type Task = {
  id: string;
  identifier: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: Assignee | null;
  labels: string[];
  linkedIssueIds?: string[];
  comments?: TaskComment[];
  dueDate?: string;
  createdAt: string;
  projectId: string;
};

export type Project = {
  id: string;
  name: string;
  identifier: string;
  color: string;
};

export const STATUS_ORDER: Status[] = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
  "cancelled",
];
