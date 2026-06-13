"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  LayoutGrid,
  LayoutList,
  Plus,
  SlidersHorizontal,
  Funnel,
  X,
} from "lucide-react";
import { Assignee, Priority, STATUS_ORDER, Status, Task } from "@/types";
import {
  DueDateFilter,
  emptyTaskFilters,
  priorityLabels,
  statusLabels,
  StatusIcon,
  TaskFilters,
  toggleFilterValue,
} from "@/lib/task-utils";
import { TaskItem } from "@/components/task-item";
import { KanbanBoard } from "@/components/kanban-board";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import type { TaskScope, TaskViewMode } from "@/lib/workspace-storage";

type TaskSort = "default" | "priority" | "due-date" | "newest" | "title";

type TaskListProps = {
  title: string;
  description: string;
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: Status) => void;
  onCreateIssue: (status?: Status) => void;
  viewMode: TaskViewMode;
  onViewModeChange: (mode: TaskViewMode) => void;
  scope: TaskScope;
  onScopeChange: (scope: TaskScope) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  activeFilters: boolean;
  totalCount: number;
  showScopeToggle: boolean;
  loading: boolean;
  showEmpty: boolean;
  assignees: Assignee[];
};

const priorityOptions: Priority[] = ["urgent", "high", "medium", "low", "none"];

const dueDateOptions: { value: DueDateFilter; label: string }[] = [
  { value: "all", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "due-soon", label: "Due soon" },
  { value: "no-date", label: "No date" },
];

const sortOptions: { value: TaskSort; label: string }[] = [
  { value: "default", label: "Default order" },
  { value: "priority", label: "Priority" },
  { value: "due-date", label: "Due date" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title" },
];

const priorityRank: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

function compareOptionalDate(a?: string, b?: string) {
  if (!a && !b) {
    return 0;
  }

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  return new Date(a).getTime() - new Date(b).getTime();
}

export function TaskList({
  title,
  description,
  tasks,
  selectedTaskId,
  onSelectTask,
  onUpdateTaskStatus,
  onCreateIssue,
  viewMode,
  onViewModeChange,
  scope,
  onScopeChange,
  filters,
  onFiltersChange,
  activeFilters,
  totalCount,
  showScopeToggle,
  loading,
  showEmpty,
  assignees,
}: TaskListProps) {
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const displayMenuRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [sortBy, setSortBy] = useState<TaskSort>("default");
  const [collapsed, setCollapsed] = useState<Record<Status, boolean>>({
    backlog: false,
    todo: false,
    "in-progress": false,
    "in-review": false,
    done: false,
    cancelled: false,
  });
  const [groupHovered, setGroupHovered] = useState<Status | null>(null);

  const sortedTasks = useMemo(() => {
    if (sortBy === "default") {
      return tasks;
    }

    return [...tasks].sort((a, b) => {
      if (sortBy === "priority") {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }

      if (sortBy === "due-date") {
        return compareOptionalDate(a.dueDate, b.dueDate);
      }

      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return a.title.localeCompare(b.title);
    });
  }, [sortBy, tasks]);

  const grouped = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      tasks: sortedTasks.filter((task) => task.status === status),
    }));
  }, [sortedTasks]);

  function updateFilters(nextFilters: Partial<TaskFilters>) {
    onFiltersChange({ ...filters, ...nextFilters });
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (filterMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      if (displayMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setFiltersOpen(false);
      setDisplayOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const content = (() => {
    if (loading) {
      return <LoadingState mode={viewMode} />;
    }

    if (showEmpty || sortedTasks.length === 0) {
      return (
        <EmptyState
          onCreateIssue={() => onCreateIssue()}
          title={activeFilters ? "No matching issues" : "No issues yet"}
          description={
            activeFilters
              ? "Clear or adjust filters to bring issues back into view."
              : "Create your first issue and start moving work from backlog to done."
          }
        />
      );
    }

    if (viewMode === "board") {
      return (
        <KanbanBoard
          tasks={sortedTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onCreateIssue={onCreateIssue}
        />
      );
    }

    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div
          className="sticky top-0 z-10 grid h-8 grid-cols-[68px_minmax(0,1fr)_110px_90px_34px] items-center gap-2 border-b px-3 text-[10px] uppercase tracking-[0.08em]"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-dim)",
            backgroundColor: "var(--bg-base)",
          }}
        >
          <span className="font-mono">ID</span>
          <span className="font-mono">Title</span>
          <span className="font-mono">Label</span>
          <span className="font-mono">Due</span>
          <span />
        </div>

        <div className="flex-1 overflow-auto pb-4">
          {grouped.map(({ status, tasks: statusTasks }) => (
            <section key={status} className="border-b" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                className="group flex h-9 w-full items-center justify-between px-3 text-xs"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={() => setGroupHovered(status)}
                onMouseLeave={() => setGroupHovered(null)}
                onClick={() => setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))}
              >
                <span className="flex items-center gap-2">
                  {collapsed[status] ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  <StatusIcon status={status} />
                  <span>{statusLabels[status]}</span>
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[10px]"
                    style={{ backgroundColor: "#222638", color: "var(--text-muted)" }}
                  >
                    {statusTasks.length}
                  </span>
                </span>

                <span
                  className={`rounded-md p-1 transition-opacity ${
                    groupHovered === status ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ color: "var(--text-dim)" }}
                >
                  <Plus
                    className="h-3.5 w-3.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCreateIssue(status);
                    }}
                  />
                </span>
              </button>

              {!collapsed[status]
                ? statusTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onSelect={onSelectTask}
                    />
                  ))
                : null}
            </section>
          ))}
        </div>
      </div>
    );
  })();

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <header
        className="flex h-14 items-center justify-between gap-3 border-b px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              <LayoutList className="h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          </div>
          {showScopeToggle ? (
            <div className="flex shrink-0 rounded-md border p-[2px]" style={{ borderColor: "var(--border)" }}>
              {(["all", "mine"] as TaskScope[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="rounded px-2 py-1 text-xs capitalize"
                  style={{
                    backgroundColor: scope === option ? "var(--bg-overlay)" : "transparent",
                    color: scope === option ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                  onClick={() => onScopeChange(option)}
                >
                  {option === "all" ? "All" : "My Issues"}
                </button>
              ))}
            </div>
          ) : null}
          <span className="font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
            {tasks.length}/{totalCount}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <label
            className="flex h-8 w-56 min-w-36 items-center gap-2 rounded-md border px-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
          >
            <Search className="h-3.5 w-3.5 text-[var(--text-dim)]" />
            <input
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search issues"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </label>

          <button
            type="button"
            onClick={() => onCreateIssue()}
            className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold"
            style={{
              backgroundColor: "var(--accent)",
              color: "#e6e8f5",
              boxShadow: "0 8px 18px rgba(99,102,241,0.28)",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Issue
          </button>

          <div ref={filterMenuRef} className="relative">
            <button
              type="button"
              className="flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-xs"
              style={{
                borderColor: activeFilters ? "var(--accent)" : "var(--border)",
                color: activeFilters ? "var(--text-primary)" : "var(--text-muted)",
              }}
              onClick={() => {
                setFiltersOpen((prev) => !prev);
                setDisplayOpen(false);
              }}
            >
              <Funnel className="h-3.5 w-3.5" />
              Filter
            </button>

            {filtersOpen ? (
              <div
                className="absolute right-0 z-30 mt-2 w-72 rounded-md border p-3"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-elevated)",
                  boxShadow: "0 18px 36px rgba(0,0,0,0.35)",
                }}
              >
                <FilterGroup title="Status">
                  {STATUS_ORDER.map((status) => (
                    <FilterOption
                      key={status}
                      active={filters.statuses.includes(status)}
                      label={statusLabels[status]}
                      onClick={() => updateFilters({ statuses: toggleFilterValue(filters.statuses, status) })}
                    />
                  ))}
                </FilterGroup>

                <FilterGroup title="Priority">
                  {priorityOptions.map((priority) => (
                    <FilterOption
                      key={priority}
                      active={filters.priorities.includes(priority)}
                      label={priorityLabels[priority]}
                      onClick={() => updateFilters({ priorities: toggleFilterValue(filters.priorities, priority) })}
                    />
                  ))}
                </FilterGroup>

                <FilterGroup title="Assignee">
                  {assignees.map((assignee) => (
                    <FilterOption
                      key={assignee.id}
                      active={filters.assigneeIds.includes(assignee.id)}
                      label={assignee.name}
                      onClick={() => updateFilters({ assigneeIds: toggleFilterValue(filters.assigneeIds, assignee.id) })}
                    />
                  ))}
                  <FilterOption
                    active={filters.assigneeIds.includes("unassigned")}
                    label="Unassigned"
                    onClick={() => updateFilters({ assigneeIds: toggleFilterValue(filters.assigneeIds, "unassigned") })}
                  />
                </FilterGroup>

                <div className="mb-3">
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                    Due date
                  </span>
                  <select
                    value={filters.dueDate}
                    onChange={(event) => updateFilters({ dueDate: event.target.value as DueDateFilter })}
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                  >
                    {dueDateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-center gap-1 rounded-md border text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  onClick={() => onFiltersChange(emptyTaskFilters)}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>

          <div ref={displayMenuRef} className="relative">
            <button
              type="button"
              className="flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-xs"
              style={{
                borderColor: sortBy !== "default" ? "var(--accent)" : "var(--border)",
                color: sortBy !== "default" ? "var(--text-primary)" : "var(--text-muted)",
              }}
              onClick={() => {
                setDisplayOpen((prev) => !prev);
                setFiltersOpen(false);
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Display
            </button>

            {displayOpen ? (
              <div
                className="absolute right-0 z-30 mt-2 w-44 rounded-md border p-2"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-elevated)",
                  boxShadow: "0 18px 36px rgba(0,0,0,0.35)",
                }}
              >
                <span className="mb-1 block px-2 text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                  Sort by
                </span>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex h-8 w-full items-center justify-between rounded px-2 text-xs"
                    style={{
                      color: sortBy === option.value ? "var(--text-primary)" : "var(--text-muted)",
                      backgroundColor: sortBy === option.value ? "var(--bg-overlay)" : "transparent",
                    }}
                    onClick={() => {
                      setSortBy(option.value);
                      setDisplayOpen(false);
                    }}
                  >
                    {option.label}
                    {sortBy === option.value ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 rounded-md border p-[2px]" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              className="rounded p-1"
              style={{
                backgroundColor: viewMode === "list" ? "var(--bg-overlay)" : "transparent",
                color: viewMode === "list" ? "var(--text-primary)" : "var(--text-muted)",
              }}
              onClick={() => onViewModeChange("list")}
              aria-label="List view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded p-1"
              style={{
                backgroundColor: viewMode === "board" ? "var(--bg-overlay)" : "transparent",
                color: viewMode === "board" ? "var(--text-primary)" : "var(--text-muted)",
              }}
              onClick={() => onViewModeChange("board")}
              aria-label="Board view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1">{content}</div>
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
        {title}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function FilterOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded px-2 py-1 text-[11px]"
      style={{
        backgroundColor: active ? "var(--accent)" : "var(--bg-base)",
        color: active ? "#edf0ff" : "var(--text-muted)",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
