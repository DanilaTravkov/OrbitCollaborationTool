"use client";

import { Plus } from "lucide-react";
import { STATUS_ORDER, Status, Task } from "@/types";
import {
  formatDueDate,
  PriorityIcon,
  StatusIcon,
  statusLabels,
} from "@/lib/task-utils";

type KanbanBoardProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onCreateIssue: (status?: Status) => void;
};

const statusDotColor: Record<Status, string> = {
  backlog: "#6b7192",
  todo: "#64748b",
  "in-progress": "#f97316",
  "in-review": "#0ea5e9",
  done: "#22c55e",
  cancelled: "#ef4444",
};

export function KanbanBoard({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateIssue,
}: KanbanBoardProps) {
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden px-4 py-3">
      <div className="flex h-full min-w-max gap-3">
        {STATUS_ORDER.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);

          return (
            <section
              key={status}
              className="flex h-full w-[272px] shrink-0 flex-col rounded-xl border p-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <header className="mb-2 flex h-8 items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-primary)" }}>
                  <StatusIcon status={status} />
                  <span className="font-medium">{statusLabels[status]}</span>
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[10px]"
                    style={{ backgroundColor: "#222638", color: "var(--text-muted)" }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                  onClick={() => onCreateIssue(status)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </header>

              <div className="flex-1 space-y-2 overflow-auto pb-2">
                {columnTasks.map((task) => {
                  const selected = selectedTaskId === task.id;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      className="w-full rounded-lg border p-2 text-left"
                      style={{
                        borderColor: selected ? "var(--accent)" : "var(--border)",
                        backgroundColor: "var(--bg-base)",
                        boxShadow: selected
                          ? "0 0 0 1px rgba(99,102,241,0.45), 0 0 22px rgba(99,102,241,0.22)"
                          : "none",
                      }}
                      onClick={() => onSelectTask(task.id)}
                    >
                      <div
                        className="mb-2 flex items-center justify-between text-[10px] font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="flex items-center gap-1.5">
                          <PriorityIcon priority={task.priority} />
                          {task.identifier}
                        </span>
                      </div>

                      <p
                        className="mb-2 text-xs leading-5"
                        style={{
                          color: "var(--text-primary)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {task.title}
                      </p>

                      <div className="mb-2 flex min-h-6 flex-wrap gap-1">
                        {task.labels.slice(0, 2).map((label) => (
                          <span
                            key={`${task.id}-${label}`}
                            className="rounded px-1.5 py-0.5 text-[10px]"
                            style={{ backgroundColor: "#1d2030", color: "var(--text-muted)" }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: statusDotColor[task.status] }}
                          />
                          <span className="font-mono">{formatDueDate(task.dueDate) || "No date"}</span>
                        </span>
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium"
                          style={{
                            backgroundColor: task.assignee?.color ?? "var(--bg-overlay)",
                            color: "#eef0ff",
                          }}
                          title={task.assignee?.name}
                        >
                          {task.assignee?.initials ?? "?"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="mt-2 flex h-9 items-center justify-center rounded-md border border-dashed text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                onClick={() => onCreateIssue(status)}
              >
                Add issue
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}