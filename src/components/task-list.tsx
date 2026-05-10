"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  SlidersHorizontal,
  Funnel,
} from "lucide-react";
import { STATUS_ORDER, Status, Task } from "@/types";
import { statusLabels, StatusIcon } from "@/lib/task-utils";
import { TaskItem } from "@/components/task-item";
import { KanbanBoard } from "@/components/kanban-board";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";

export type TaskViewMode = "list" | "board";
export type TaskScope = "all" | "mine";

type TaskListProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onCreateIssue: (status?: Status) => void;
  viewMode: TaskViewMode;
  onViewModeChange: (mode: TaskViewMode) => void;
  scope: TaskScope;
  onScopeChange: (scope: TaskScope) => void;
  loading: boolean;
  showEmpty: boolean;
  currentUserId: string;
};

export function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateIssue,
  viewMode,
  onViewModeChange,
  scope,
  onScopeChange,
  loading,
  showEmpty,
  currentUserId,
}: TaskListProps) {
  const [collapsed, setCollapsed] = useState<Record<Status, boolean>>({
    backlog: false,
    todo: false,
    "in-progress": false,
    "in-review": false,
    done: false,
    cancelled: false,
  });
  const [groupHovered, setGroupHovered] = useState<Status | null>(null);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => (scope === "mine" ? task.assignee?.id === currentUserId : true)),
    [currentUserId, scope, tasks]
  );

  const grouped = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      tasks: visibleTasks.filter((task) => task.status === status),
    }));
  }, [visibleTasks]);

  const content = (() => {
    if (loading) {
      return <LoadingState mode={viewMode} />;
    }

    if (showEmpty) {
      return <EmptyState onCreateIssue={() => onCreateIssue()} />;
    }

    if (viewMode === "board") {
      return (
        <KanbanBoard
          tasks={visibleTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
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
        className="flex h-14 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            <LayoutList className="h-4 w-4" />
            All Issues
          </span>
          <div className="flex rounded-md border p-[2px]" style={{ borderColor: "var(--border)" }}>
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
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <Funnel className="h-3.5 w-3.5" />
            Filter
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Display
          </button>

          <div className="flex rounded-md border p-[2px]" style={{ borderColor: "var(--border)" }}>
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