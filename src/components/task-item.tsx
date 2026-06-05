"use client";

import { useState } from "react";
import { MessageSquare, MoreHorizontal } from "lucide-react";
import type { Task } from "@/types";
import { formatDueDate, PriorityIcon, StatusIcon } from "@/lib/task-utils";

type TaskItemProps = {
  task: Task;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
};

export function TaskItem({ task, isSelected, onSelect }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const firstLabel = task.labels[0] ?? "";
  const due = formatDueDate(task.dueDate);
  const commentCount = task.comments?.length ?? 0;

  return (
    <button
      type="button"
      className="relative grid h-[38px] w-full grid-cols-[20px_68px_20px_minmax(0,1fr)_110px_90px_34px] items-center gap-2 border-b px-3 text-left text-xs transition-colors"
      style={{
        borderColor: "var(--border)",
        backgroundColor: isSelected ? "#161928" : "transparent",
        color: "var(--text-primary)",
      }}
      onClick={() => onSelect(task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isSelected ? (
        <span
          className="absolute left-0 top-0 h-full w-[2px]"
          style={{ backgroundColor: "var(--accent)" }}
        />
      ) : null}

      <span className="flex items-center justify-center text-[var(--text-muted)]">
        <PriorityIcon priority={task.priority} />
      </span>

      <span className="truncate font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
        {task.identifier}
      </span>

      <span className="flex items-center justify-center text-[var(--text-muted)]">
        <StatusIcon status={task.status} />
      </span>

      <span className="truncate">{task.title}</span>

      {isHovered ? (
        <span className="col-span-2 flex items-center justify-end gap-1">
          <span className="flex items-center gap-1 rounded p-1 text-[var(--text-muted)]">
            <MessageSquare className="h-3.5 w-3.5" />
            {commentCount ? <span className="font-mono text-[10px]">{commentCount}</span> : null}
          </span>
          <span className="rounded p-1 text-[var(--text-muted)]">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </span>
        </span>
      ) : (
        <>
          <span className="truncate">
            {firstLabel ? (
              <span
                className="inline-flex max-w-full items-center rounded px-2 py-[2px] text-[10px]"
                style={{ backgroundColor: "#1d2030", color: "var(--text-muted)" }}
              >
                <span className="truncate">{firstLabel}</span>
              </span>
            ) : (
              <span style={{ color: "var(--text-dim)" }}>-</span>
            )}
          </span>
          <span className="truncate font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
            {due || "No date"}
          </span>
        </>
      )}

      <span className="flex justify-end">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: task.assignee?.color ?? "var(--bg-overlay)",
            color: "#e9ecfb",
          }}
          title={task.assignee?.name}
        >
          {task.assignee?.initials ?? "?"}
        </span>
      </span>
    </button>
  );
}
