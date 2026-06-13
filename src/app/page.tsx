"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PROJECTS, TASKS, ASSIGNEES, CURRENT_USER } from "@/data";
import type { Status, Task } from "@/types";
import { Sidebar } from "@/components/sidebar";
import { TaskList } from "@/components/task-list";
import { TaskDetailPanel } from "@/components/task-detail-panel";
import { MemberWorkloadOverview } from "@/components/member-workload-overview";
import {
  emptyTaskFilters,
  hasActiveTaskFilters,
  matchesTaskFilters,
  TaskFilters,
} from "@/lib/task-utils";
import {
  readWorkspaceState,
  writeWorkspaceState,
} from "@/lib/workspace-storage";
import type { TaskScope, TaskViewMode } from "@/lib/workspace-storage";
import { resolveWorkspaceView } from "@/lib/workspace-views";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(TASKS[0]?.id ?? null);
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<Status | undefined>(undefined);
  const [showLoading, setShowLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("list");
  const [scope, setScope] = useState<TaskScope>("all");
  const [filters, setFilters] = useState<TaskFilters>(emptyTaskFilters);
  const [storageReady, setStorageReady] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const workspaceView = useMemo(
    () =>
      resolveWorkspaceView({
        selectionId: selectedProjectId,
        tasks,
        projects: PROJECTS,
        assignees: ASSIGNEES,
        currentUserId: CURRENT_USER.id,
      }),
    [selectedProjectId, tasks]
  );

  const scopedTasks = useMemo(
    () =>
      workspaceView.tasks.filter((task) =>
        workspaceView.allowsScope && scope === "mine" ? task.assignee?.id === CURRENT_USER.id : true
      ),
    [scope, workspaceView]
  );

  const activeFilters = hasActiveTaskFilters(filters);
  const visibleTasks = useMemo(
    () => scopedTasks.filter((task) => matchesTaskFilters(task, filters)),
    [filters, scopedTasks]
  );

  useEffect(() => {
    if (!selectedTaskId) {
      return;
    }

    const selectedStillExists = tasks.some((task) => task.id === selectedTaskId);
    if (!selectedStillExists && !isCreating) {
      setSelectedTaskId(null);
    }
  }, [isCreating, selectedTaskId, tasks]);

  useEffect(() => {
    const storedState = readWorkspaceState();

    setTasks(storedState.tasks);
    setSelectedProjectId(storedState.preferences.selectedProjectId);
    setSelectedTaskId(storedState.preferences.selectedTaskId);
    setViewMode(storedState.preferences.viewMode);
    setScope(storedState.preferences.scope);
    setFilters(storedState.preferences.filters);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    writeWorkspaceState({
      tasks,
      preferences: {
        selectedProjectId,
        selectedTaskId: selectedTaskId && tasks.some((task) => task.id === selectedTaskId) ? selectedTaskId : null,
        viewMode,
        scope,
        filters,
      },
    });
  }, [filters, scope, selectedProjectId, selectedTaskId, storageReady, tasks, viewMode]);

  function buildIdentifier(projectId: string, taskList: Task[]) {
    const project = PROJECTS.find((entry) => entry.id === projectId);
    const prefix = project?.identifier ?? "ORB";
    const maxNumber = taskList.reduce((max, task) => {
      if (!task.identifier.startsWith(`${prefix}-`)) {
        return max;
      }
      const numeric = Number(task.identifier.replace(`${prefix}-`, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    return `${prefix}-${String(maxNumber + 1).padStart(3, "0")}`;
  }

  function openCreateIssue(status?: Status) {
    setCreateStatus(status);
    setSelectedTaskId(null);
    setIsCreating(true);
  }

  function handleCreateTask(task: Omit<Task, "id" | "identifier" | "createdAt">) {
    const nextTask: Task = {
      ...task,
      id: `task-${Date.now().toString(36)}`,
      identifier: buildIdentifier(task.projectId, tasks),
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [nextTask, ...prev]);
    setIsCreating(false);
    setSelectedTaskId(nextTask.id);
  }

  function handleUpdateTask(updatedTask: Task) {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }

  function handleUpdateTaskStatus(taskId: string, status: Status) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
  }

  function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setSelectedTaskId(null);
    setIsCreating(false);
  }

  const preferredProjectId = workspaceView.createProjectId;
  const nextIdentifier = buildIdentifier(preferredProjectId, tasks);
  const isIssueView = workspaceView.kind === "issues";
  const isPanelOpen = isIssueView && (isCreating || Boolean(selectedTask));

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="relative flex h-full overflow-hidden">
        <Sidebar
          projects={PROJECTS}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        {workspaceView.kind === "members" ? (
          <MemberWorkloadOverview
            title={workspaceView.title}
            description={workspaceView.description}
            members={workspaceView.members}
            totalIssueCount={tasks.length}
          />
        ) : (
          <TaskList
            title={workspaceView.title}
            description={workspaceView.description}
            tasks={showEmpty ? [] : visibleTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(taskId) => {
              setSelectedTaskId(taskId);
              setIsCreating(false);
            }}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onCreateIssue={openCreateIssue}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            scope={scope}
            onScopeChange={setScope}
            filters={filters}
            onFiltersChange={setFilters}
            activeFilters={activeFilters}
            totalCount={scopedTasks.length}
            showScopeToggle={workspaceView.allowsScope}
            loading={showLoading}
            showEmpty={showEmpty}
            assignees={ASSIGNEES}
          />
        )}

        <AnimatePresence>
          {isPanelOpen ? (
            <TaskDetailPanel
              key={selectedTask?.id ?? "create"}
              task={isCreating ? null : selectedTask}
              isCreating={isCreating}
              projects={PROJECTS}
              assignees={ASSIGNEES}
              currentUser={CURRENT_USER}
              availableTasks={tasks}
              nextIdentifier={nextIdentifier}
              initialStatus={createStatus}
              onClose={() => {
                setIsCreating(false);
                setSelectedTaskId(null);
              }}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : null}
        </AnimatePresence>
      </main>

      {/* <section
        className="fixed bottom-4 right-4 w-52 rounded-lg border p-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border)",
          boxShadow: "0 18px 36px rgba(0, 0, 0, 0.35)",
        }}
      >
        <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Dev Controls
        </h3>
        <label className="mb-2 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          Show loading
          <input
            type="checkbox"
            checked={showLoading}
            onChange={(event) => {
              setShowLoading(event.target.checked);
              if (event.target.checked) {
                setShowEmpty(false);
              }
            }}
            className="accent-[var(--accent)]"
          />
        </label>
        <label className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          Show empty state
          <input
            type="checkbox"
            checked={showEmpty}
            onChange={(event) => {
              setShowEmpty(event.target.checked);
              if (event.target.checked) {
                setShowLoading(false);
              }
            }}
            className="accent-[var(--accent)]"
          />
        </label>
      </section> */}
    </div>
  );
}
