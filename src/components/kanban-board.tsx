"use client";

import { useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, GripVertical, MessageSquare, Plus } from "lucide-react";
import { STATUS_ORDER } from "@/types";
import type { Status, Task } from "@/types";
import {
  formatDueDate,
  IssueTypeIcon,
  issueTypeLabels,
  PriorityIcon,
  StatusIcon,
  statusLabels,
} from "@/lib/task-utils";

type KanbanBoardProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: Status) => void;
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
  onUpdateTaskStatus,
  onCreateIssue,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<Status | null>(null);

  function moveTask(task: Task, status: Status) {
    if (task.status === status) {
      return;
    }

    onUpdateTaskStatus(task.id, status);
  }

  function moveTaskByOffset(task: Task, offset: -1 | 1) {
    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const nextStatus = STATUS_ORDER[currentIndex + offset];

    if (nextStatus) {
      moveTask(task, nextStatus);
    }
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, taskId: string) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onSelectTask(taskId);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, taskId: string) {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: Status) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    const task = tasks.find((entry) => entry.id === taskId);

    if (task) {
      moveTask(task, status);
    }

    setDraggedTaskId(null);
    setDropStatus(null);
  }

  return (
    <div className="h-full min-h-0 overflow-auto overscroll-contain px-3 py-3 sm:px-4">
      <div className="flex h-full min-h-0 min-w-max gap-3">
        {STATUS_ORDER.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          const isDropTarget = dropStatus === status && draggedTaskId !== null;

          return (
            <section
              key={status}
              className="flex h-full min-h-0 w-[272px] shrink-0 flex-col rounded-xl border p-2 transition-colors"
              style={{
                borderColor: isDropTarget ? "var(--accent)" : "var(--border)",
                backgroundColor: isDropTarget ? "#111426" : "var(--bg-surface)",
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropStatus(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropStatus(null);
                }
              }}
              onDrop={(event) => handleDrop(event, status)}
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
                  aria-label={`Create issue in ${statusLabels[status]}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-auto pb-2">
                {columnTasks.map((task) => {
                  const selected = selectedTaskId === task.id;
                  const commentCount = task.comments?.length ?? 0;
                  const statusIndex = STATUS_ORDER.indexOf(task.status);
                  const previousStatus = STATUS_ORDER[statusIndex - 1];
                  const nextStatus = STATUS_ORDER[statusIndex + 1];

                  return (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      className="w-full cursor-pointer rounded-lg border p-2 text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      style={{
                        borderColor: selected ? "var(--accent)" : "var(--border)",
                        backgroundColor: "var(--bg-base)",
                        boxShadow: selected
                          ? "0 0 0 1px rgba(99,102,241,0.45), 0 0 22px rgba(99,102,241,0.22)"
                          : "none",
                        opacity: draggedTaskId === task.id ? 0.55 : 1,
                      }}
                      onClick={() => onSelectTask(task.id)}
                      onKeyDown={(event) => handleCardKeyDown(event, task.id)}
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDropStatus(null);
                      }}
                      aria-label={`${task.identifier}: ${task.title}`}
                    >
                      <div
                        className="mb-2 flex items-center justify-between text-[10px] font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="flex items-center gap-1.5">
                          <GripVertical className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                          <PriorityIcon priority={task.priority} />
                          <span title={issueTypeLabels[task.issueType]}>
                            <IssueTypeIcon issueType={task.issueType} />
                          </span>
                          {task.identifier}
                        </span>
                        {commentCount ? (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {commentCount}
                          </span>
                        ) : null}
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

                      <div className="mb-2 grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          disabled={!previousStatus}
                          className="flex h-7 items-center justify-center rounded border text-[10px] disabled:cursor-not-allowed disabled:opacity-35"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                          onClick={(event) => {
                            event.stopPropagation();
                            moveTaskByOffset(task, -1);
                          }}
                          aria-label={previousStatus ? `Move to ${statusLabels[previousStatus]}` : "No previous status"}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!nextStatus}
                          className="flex h-7 items-center justify-center rounded border text-[10px] disabled:cursor-not-allowed disabled:opacity-35"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                          onClick={(event) => {
                            event.stopPropagation();
                            moveTaskByOffset(task, 1);
                          }}
                          aria-label={nextStatus ? `Move to ${statusLabels[nextStatus]}` : "No next status"}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
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
                    </div>
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
