"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  KanbanSquare,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import type { Assignee, Project, Status, Task } from "@/types";
import { Sidebar } from "@/components/sidebar";
import { TaskList } from "@/components/task-list";
import { TaskDetailPanel } from "@/components/task-detail-panel";
import { MemberWorkloadOverview } from "@/components/member-workload-overview";
import { CommandPalette } from "@/components/command-palette";
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
import { authSessionToAssignee } from "@/lib/auth-storage";
import type { AuthSession } from "@/lib/auth-storage";
import { getCurrentAuthSession, signOut } from "@/lib/supabase/auth";
import { requestWorkspaceSnapshot } from "@/lib/api/workspace";
import { PrefetchLink } from "@/components/prefetch-link";

export default function Home() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<Status | undefined>(undefined);
  const [showLoading, setShowLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("list");
  const [scope, setScope] = useState<TaskScope>("all");
  const [filters, setFilters] = useState<TaskFilters>(emptyTaskFilters);
  const [storageReady, setStorageReady] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const currentUser = useMemo(
    () => (authSession ? authSessionToAssignee(authSession) : null),
    [authSession]
  );
  const workspaceAssignees = useMemo(() => {
    if (!currentUser) {
      return assignees;
    }

    return assignees.some((assignee) => assignee.id === currentUser.id)
      ? assignees
      : [currentUser, ...assignees];
  }, [assignees, currentUser]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const workspaceView = useMemo(
    () =>
      resolveWorkspaceView({
        selectionId: selectedProjectId,
        tasks,
        projects,
        assignees: workspaceAssignees,
        currentUserId: currentUser?.id ?? "",
      }),
    [currentUser?.id, projects, selectedProjectId, tasks, workspaceAssignees]
  );

  const scopedTasks = useMemo(
    () =>
      workspaceView.tasks.filter((task) =>
        workspaceView.allowsScope && scope === "mine" ? task.assignee?.id === currentUser?.id : true
      ),
    [currentUser?.id, scope, workspaceView]
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
    let active = true;

    getCurrentAuthSession()
      .then((session) => {
        if (active) {
          setAuthSession(session);
        }
      })
      .catch(() => {
        if (active) {
          setAuthSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setAuthReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authSession) {
      return;
    }

    let active = true;
    setShowLoading(true);
    setDataError(null);

    requestWorkspaceSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }

        const storedState = readWorkspaceState();
        const selectedTaskExists =
          storedState.preferences.selectedTaskId &&
          snapshot.tasks.some((task) => task.id === storedState.preferences.selectedTaskId);

        setTasks(snapshot.tasks);
        setProjects(snapshot.projects);
        setAssignees(snapshot.assignees);
        setSelectedProjectId(storedState.preferences.selectedProjectId);
        setSelectedTaskId(selectedTaskExists ? storedState.preferences.selectedTaskId : snapshot.tasks[0]?.id ?? null);
        setViewMode(storedState.preferences.viewMode);
        setScope(storedState.preferences.scope);
        setFilters(storedState.preferences.filters);
        setStorageReady(true);
      })
      .catch((error) => {
        if (active) {
          setDataError(error instanceof Error ? error.message : "Failed to load workspace data.");
        }
      })
      .finally(() => {
        if (active) {
          setShowLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authSession]);

  useEffect(() => {
    if (!storageReady || !authSession) {
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
  }, [authSession, filters, scope, selectedProjectId, selectedTaskId, storageReady, tasks, viewMode]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function buildIdentifier(projectId: string, taskList: Task[]) {
    const project = projects.find((entry) => entry.id === projectId);
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

  function selectWorkspace(selectionId: string) {
    setSelectedProjectId(selectionId);
    setSelectedTaskId(null);
    setIsCreating(false);
  }

  function openTaskFromPalette(task: Task) {
    setSelectedProjectId(task.projectId);
    setSelectedTaskId(task.id);
    setIsCreating(false);
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

  async function handleLogout() {
    await signOut().catch(() => undefined);
    setAuthSession(null);
    setStorageReady(false);
    setSelectedTaskId(null);
    setIsCreating(false);
    setCommandPaletteOpen(false);
  }

  const preferredProjectId = workspaceView.createProjectId;
  const nextIdentifier = buildIdentifier(preferredProjectId, tasks);
  const isIssueView = workspaceView.kind === "issues";
  const isPanelOpen = isIssueView && (isCreating || Boolean(selectedTask));

  if (!authReady) {
    return (
      <div className="h-screen" style={{ backgroundColor: "var(--bg-base)" }} />
    );
  }

  if (!authSession || !currentUser) {
    return <LoggedOutWorkspace />;
  }

  if (dataError) {
    return (
      <main className="flex h-screen items-center justify-center px-5" style={{ backgroundColor: "var(--bg-base)" }}>
        <section
          className="w-full max-w-md rounded-lg border px-6 py-7"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
        >
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Workspace request failed
          </h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            {dataError}
          </p>
          <button
            type="button"
            className="mt-5 h-10 rounded-md px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="relative flex h-full overflow-hidden">
        <Sidebar
          projects={projects}
          session={authSession}
          selectedProjectId={selectedProjectId}
          onSelectProject={selectWorkspace}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onLogout={handleLogout}
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
            assignees={workspaceAssignees}
          />
        )}

        <AnimatePresence>
          {isPanelOpen ? (
            <TaskDetailPanel
              key={selectedTask?.id ?? "create"}
              task={isCreating ? null : selectedTask}
              isCreating={isCreating}
              projects={projects}
              assignees={workspaceAssignees}
              currentUser={currentUser}
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

      <AnimatePresence>
        {commandPaletteOpen ? (
          <CommandPalette
            open={commandPaletteOpen}
            tasks={tasks}
            projects={projects}
            viewMode={viewMode}
            activeFilters={activeFilters}
            onClose={() => setCommandPaletteOpen(false)}
            onCreateIssue={() => openCreateIssue()}
            onOpenTask={openTaskFromPalette}
            onSelectWorkspace={selectWorkspace}
            onViewModeChange={setViewMode}
            onFiltersChange={setFilters}
          />
        ) : null}
      </AnimatePresence>

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

function LoggedOutWorkspace() {
  return (
    <main className="h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      <header
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between border-b px-5"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-md"
            style={{
              background: "linear-gradient(145deg, var(--accent) 0%, #818cf8 45%, #312e81 100%)",
              boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 24px rgba(99,102,241,0.25)",
            }}
          />
          <span className="text-base font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
            Orbit
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: "var(--text-muted)" }}>
          <span>Planning</span>
          <span>Issues</span>
          <span>Workload</span>
          <span>Cycles</span>
        </nav>

        <PrefetchLink
          href="/auth"
          className="flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold"
          style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
        >
          Sign in
          <LogIn className="h-4 w-4" />
        </PrefetchLink>
      </header>

      <section className="mx-auto grid h-[calc(100vh-64px)] w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1fr)]">
        <div className="min-w-0">
          <div
            className="mb-5 inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Built for focused product teams
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-normal md:text-6xl" style={{ color: "var(--text-primary)" }}>
            Plan work.
            <br />
            Track issues.
            <br />
            Ship together.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--text-muted)" }}>
            Orbit gives teams a fast workspace for triaging issues, planning project cycles, reviewing active work,
            and understanding who owns what without losing the thread.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <PrefetchLink
              href="/auth"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold"
              style={{
                backgroundColor: "var(--accent)",
                color: "#edf0ff",
                boxShadow: "0 12px 28px rgba(99,102,241,0.28)",
              }}
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </PrefetchLink>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              Login or create an account with email and password.
            </span>
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <LandingStat icon={KanbanSquare} label="Boards" value="Drag work across status lanes" />
            <LandingStat icon={Users} label="Members" value="See ownership and workload" />
            <LandingStat icon={MessageSquare} label="Activity" value="Keep issue context in one place" />
          </div>
        </div>

        <div
          className="relative hidden min-h-[520px] overflow-hidden rounded-lg border p-4 lg:block"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Atlas project
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Active sprint overview
              </span>
            </div>
            <div className="flex gap-1">
              {["#6366f1", "#10b981", "#f59e0b"].map((color) => (
                <span key={color} className="h-7 w-7 rounded-full border-2 border-[var(--bg-surface)]" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-3">
            <aside className="space-y-2 rounded-md border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
              {[
                { icon: LayoutDashboard, label: "All Issues", active: true },
                { icon: KanbanSquare, label: "Board", active: false },
                { icon: GitBranch, label: "Cycles", active: false },
                { icon: Users, label: "Members", active: false },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex h-9 items-center gap-2 rounded-md px-2 text-xs"
                    style={{
                      backgroundColor: item.active ? "var(--bg-overlay)" : "transparent",
                      color: item.active ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                );
              })}
            </aside>

            <section className="min-w-0 rounded-md border" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div className="grid h-9 grid-cols-[72px_minmax(0,1fr)_82px_68px] items-center gap-2 border-b px-3 text-[10px] uppercase tracking-[0.08em]" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
                <span>ID</span>
                <span>Title</span>
                <span>Status</span>
                <span>Owner</span>
              </div>
              {[
                ["ATL-003", "Implement OAuth2 with PKCE", "Todo", "SC"],
                ["ATL-006", "Add keyboard navigation", "Review", "LB"],
                ["ATL-005", "Redesign onboarding flow", "Active", "JL"],
                ["ATL-007", "Integrate billing webhooks", "Done", "SC"],
              ].map(([id, title, status, owner]) => (
                <div key={id} className="grid h-12 grid-cols-[72px_minmax(0,1fr)_82px_68px] items-center gap-2 border-b px-3 text-xs last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{id}</span>
                  <span className="truncate" style={{ color: "var(--text-primary)" }}>{title}</span>
                  <span className="rounded px-2 py-1 text-[10px]" style={{ backgroundColor: "var(--bg-overlay)", color: "var(--text-muted)" }}>{status}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#29304a", color: "#dbe2ff" }}>{owner}</span>
                </div>
              ))}
            </section>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <PreviewMetric label="Active" value="8" />
            <PreviewMetric label="Review" value="3" />
            <PreviewMetric label="Done" value="14" />
          </div>

          <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3">
            {["Backlog", "In progress", "In review"].map((column, index) => (
              <div key={column} className="rounded-md border p-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
                <div className="mb-2 flex items-center justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span>{column}</span>
                  <span>{index + 2}</span>
                </div>
                <div className="space-y-2">
                  <div className="h-12 rounded border" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }} />
                  <div className="h-9 rounded border" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function LandingStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}>
      <Icon className="mb-2 h-4 w-4 text-[var(--accent)]" />
      <span className="block text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      <span className="mt-1 block text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>
        {value}
      </span>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
      <span className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <span className="mt-1 block text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
