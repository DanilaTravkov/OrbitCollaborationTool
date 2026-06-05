import type { Assignee, Project, Status, Task } from "@/types";

export type SidebarViewId = "inbox" | "my-issues" | "all" | "cycles" | "members";
export type WorkspaceViewKind = "issues" | "members";

export type MemberWorkload = {
  assignee: Assignee;
  assignedCount: number;
  activeCount: number;
  reviewCount: number;
  completedCount: number;
  overdueCount: number;
};

export type WorkspaceView = {
  id: string;
  kind: WorkspaceViewKind;
  title: string;
  description: string;
  tasks: Task[];
  totalCount: number;
  allowsScope: boolean;
  createProjectId: string;
  members: MemberWorkload[];
};

export const sidebarViewIds: SidebarViewId[] = ["inbox", "my-issues", "all", "cycles", "members"];

const activeStatuses = new Set<Status>(["backlog", "todo", "in-progress", "in-review"]);

export function isSidebarViewId(value: string): value is SidebarViewId {
  return sidebarViewIds.includes(value as SidebarViewId);
}

export function getSidebarSelectionId(selectionId: string) {
  return isSidebarViewId(selectionId) ? selectionId : null;
}

function isActiveTask(task: Task) {
  return activeStatuses.has(task.status);
}

function isOverdue(task: Task) {
  return Boolean(task.dueDate) && isActiveTask(task) && new Date(task.dueDate ?? "").getTime() < Date.now();
}

function buildMemberWorkload(tasks: Task[], assignees: Assignee[]): MemberWorkload[] {
  return assignees.map((assignee) => {
    const assignedTasks = tasks.filter((task) => task.assignee?.id === assignee.id);

    return {
      assignee,
      assignedCount: assignedTasks.length,
      activeCount: assignedTasks.filter(isActiveTask).length,
      reviewCount: assignedTasks.filter((task) => task.status === "in-review").length,
      completedCount: assignedTasks.filter((task) => task.status === "done").length,
      overdueCount: assignedTasks.filter(isOverdue).length,
    };
  });
}

export function resolveWorkspaceView({
  selectionId,
  tasks,
  projects,
  assignees,
  currentUserId,
}: {
  selectionId: string;
  tasks: Task[];
  projects: Project[];
  assignees: Assignee[];
  currentUserId: string;
}): WorkspaceView {
  const fallbackProjectId = projects[0]?.id ?? "";
  const members = buildMemberWorkload(tasks, assignees);

  if (selectionId === "inbox") {
    const inboxTasks = tasks.filter(
      (task) => isActiveTask(task) && (!task.assignee || task.assignee.id === currentUserId)
    );

    return {
      id: selectionId,
      kind: "issues",
      title: "Inbox",
      description: "Unassigned work and your active assignments",
      tasks: inboxTasks,
      totalCount: inboxTasks.length,
      allowsScope: false,
      createProjectId: fallbackProjectId,
      members,
    };
  }

  if (selectionId === "my-issues") {
    const ownedTasks = tasks.filter((task) => task.assignee?.id === currentUserId);

    return {
      id: selectionId,
      kind: "issues",
      title: "My Issues",
      description: "All issues assigned to you",
      tasks: ownedTasks,
      totalCount: ownedTasks.length,
      allowsScope: false,
      createProjectId: fallbackProjectId,
      members,
    };
  }

  if (selectionId === "cycles") {
    const cycleTasks = tasks.filter((task) => Boolean(task.dueDate) && isActiveTask(task));

    return {
      id: selectionId,
      kind: "issues",
      title: "Cycles",
      description: "Due-dated active issues for planning",
      tasks: cycleTasks,
      totalCount: cycleTasks.length,
      allowsScope: true,
      createProjectId: fallbackProjectId,
      members,
    };
  }

  if (selectionId === "members") {
    return {
      id: selectionId,
      kind: "members",
      title: "Members",
      description: "Team workload by assignee",
      tasks,
      totalCount: assignees.length,
      allowsScope: false,
      createProjectId: fallbackProjectId,
      members,
    };
  }

  if (selectionId !== "all") {
    const project = projects.find((entry) => entry.id === selectionId);
    if (project) {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);

      return {
        id: project.id,
        kind: "issues",
        title: project.name,
        description: `${project.identifier} project issues`,
        tasks: projectTasks,
        totalCount: projectTasks.length,
        allowsScope: true,
        createProjectId: project.id,
        members,
      };
    }
  }

  return {
    id: "all",
    kind: "issues",
    title: "All Issues",
    description: "Every issue across the workspace",
    tasks,
    totalCount: tasks.length,
    allowsScope: true,
    createProjectId: fallbackProjectId,
    members,
  };
}
