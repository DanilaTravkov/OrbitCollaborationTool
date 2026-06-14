import type { Assignee, Project, Task } from "@/types";

export type WorkspaceSnapshot = {
  assignees: Assignee[];
  projects: Project[];
  tasks: Task[];
};

export async function requestWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const response = await fetch("/api/workspace", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to load workspace data.");
  }

  return response.json() as Promise<WorkspaceSnapshot>;
}
