"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  CircleEllipsis,
  Flag,
  Send,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { Priority, Project, Status, Task, Assignee } from "@/types";
import { priorityLabels, statusLabels } from "@/lib/task-utils";

type TaskDetailPanelProps = {
  task: Task | null;
  isCreating: boolean;
  projects: Project[];
  assignees: Assignee[];
  nextIdentifier: string;
  initialStatus?: Status;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, "id" | "identifier" | "createdAt">) => void;
  onUpdateTask: (task: Task) => void;
};

type EditableTask = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: Assignee | null;
  labels: string[];
  dueDate?: string;
  projectId: string;
};

type DropdownKey = "status" | "priority" | "assignee" | "project" | null;
type PanelTab = "description" | "activity";

const statusOptions: Status[] = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
  "cancelled",
];

const priorityOptions: Priority[] = ["urgent", "high", "medium", "low", "none"];

function toDraft(task: Task | null, defaults: { assignee: Assignee | null; projectId: string; status: Status }): EditableTask {
  if (!task) {
    return {
      title: "",
      description: "",
      status: defaults.status,
      priority: "medium",
      assignee: defaults.assignee,
      labels: [],
      dueDate: "",
      projectId: defaults.projectId,
    };
  }

  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    labels: task.labels,
    dueDate: task.dueDate ?? "",
    projectId: task.projectId,
  };
}

export function TaskDetailPanel({
  task,
  isCreating,
  projects,
  assignees,
  nextIdentifier,
  initialStatus,
  onClose,
  onCreateTask,
  onUpdateTask,
}: TaskDetailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>("description");
  const [labelsInput, setLabelsInput] = useState("");
  const [activityInput, setActivityInput] = useState("");
  const [draft, setDraft] = useState<EditableTask>(() =>
    toDraft(task, {
      assignee: assignees[0] ?? null,
      projectId: projects[0]?.id ?? "",
      status: initialStatus ?? "todo",
    })
  );

  useEffect(() => {
    setDraft(
      toDraft(task, {
        assignee: assignees[0] ?? null,
        projectId: projects[0]?.id ?? "",
        status: initialStatus ?? "todo",
      })
    );
    setLabelsInput(task?.labels.join(", ") ?? "");
  }, [assignees, initialStatus, isCreating, projects, task]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        onClose();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onClose]);

  const project = useMemo(
    () => projects.find((entry) => entry.id === draft.projectId),
    [draft.projectId, projects]
  );

  const identifier = isCreating ? nextIdentifier : task?.identifier ?? "UNKNOWN";

  function syncTask(nextDraft: EditableTask) {
    if (!task || isCreating) {
      return;
    }

    onUpdateTask({
      ...task,
      title: nextDraft.title,
      description: nextDraft.description,
      status: nextDraft.status,
      priority: nextDraft.priority,
      assignee: nextDraft.assignee,
      labels: nextDraft.labels,
      dueDate: nextDraft.dueDate || undefined,
      projectId: nextDraft.projectId,
    });
  }

  function updateDraft<K extends keyof EditableTask>(key: K, value: EditableTask[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      syncTask(next);
      return next;
    });
  }

  function handleLabelsBlur() {
    const parsed = labelsInput
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);
    updateDraft("labels", parsed);
  }

  function handleCreate() {
    if (!draft.title.trim()) {
      return;
    }

    onCreateTask({
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: draft.status,
      priority: draft.priority,
      assignee: draft.assignee,
      labels: draft.labels,
      dueDate: draft.dueDate || undefined,
      projectId: draft.projectId,
    });
  }

  function DropdownButton({
    name,
    value,
    dropdownKey,
    children,
  }: {
    name: string;
    value: string;
    dropdownKey: Exclude<DropdownKey, null>;
    children: React.ReactNode;
  }) {
    return (
      <div className="relative">
        <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          {name}
        </span>
        <button
          type="button"
          className="flex h-8 w-full items-center justify-between rounded-md border px-2 text-xs"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
          onClick={() => setOpenDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))}
        >
          <span className="truncate">{value}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-dim)]" />
        </button>
        {openDropdown === dropdownKey ? (
          <div
            className="absolute z-20 mt-1 w-full rounded-md border py-1"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-elevated)",
              boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
            }}
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <motion.aside
      key="detail-panel"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute right-0 top-0 z-20 h-full w-[380px] border-l shadow-2xl"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div ref={containerRef} className="flex h-full flex-col">
        <header
          className="flex h-14 items-center justify-between border-b px-3"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            {identifier}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              aria-label="More"
            >
              <CircleEllipsis className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            <DropdownButton name="Status" value={statusLabels[draft.status]} dropdownKey="status">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-overlay)]"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => {
                    updateDraft("status", status);
                    setOpenDropdown(null);
                  }}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </DropdownButton>

            <DropdownButton name="Priority" value={priorityLabels[draft.priority]} dropdownKey="priority">
              {priorityOptions.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className="block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-overlay)]"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => {
                    updateDraft("priority", priority);
                    setOpenDropdown(null);
                  }}
                >
                  {priorityLabels[priority]}
                </button>
              ))}
            </DropdownButton>

            <DropdownButton
              name="Assignee"
              value={draft.assignee?.name ?? "Unassigned"}
              dropdownKey="assignee"
            >
              <button
                type="button"
                className="block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-overlay)]"
                style={{ color: "var(--text-primary)" }}
                onClick={() => {
                  updateDraft("assignee", null);
                  setOpenDropdown(null);
                }}
              >
                Unassigned
              </button>
              {assignees.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className="block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-overlay)]"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => {
                    updateDraft("assignee", member);
                    setOpenDropdown(null);
                  }}
                >
                  {member.name}
                </button>
              ))}
            </DropdownButton>

            <DropdownButton name="Project" value={project?.name ?? "None"} dropdownKey="project">
              {projects.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-overlay)]"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => {
                    updateDraft("projectId", entry.id);
                    setOpenDropdown(null);
                  }}
                >
                  {entry.name}
                </button>
              ))}
            </DropdownButton>
          </div>

          <div className="mt-4 space-y-3">
            <textarea
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="Issue title"
              className="min-h-10 w-full resize-none border-none bg-transparent p-0 text-xl font-semibold outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            <textarea
              value={draft.description}
              onChange={(event) => updateDraft("description", event.target.value)}
              placeholder="Describe the issue..."
              className="min-h-28 w-full resize-none rounded-md border px-2 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-muted)",
              }}
            />
          </div>

          <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <MetaRow icon={UserRound} label="Assignee">
              {draft.assignee?.name ?? "Unassigned"}
            </MetaRow>
            <MetaRow icon={Flag} label="Priority">
              {priorityLabels[draft.priority]}
            </MetaRow>
            <MetaRow icon={CircleEllipsis} label="Status">
              {statusLabels[draft.status]}
            </MetaRow>
            <MetaRow icon={Tag} label="Labels">
              <input
                value={labelsInput}
                onChange={(event) => setLabelsInput(event.target.value)}
                onBlur={handleLabelsBlur}
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: "var(--text-muted)" }}
                placeholder="comma, separated, labels"
              />
            </MetaRow>
            <MetaRow icon={CalendarDays} label="Due Date">
              <input
                type="date"
                value={draft.dueDate ?? ""}
                onChange={(event) => updateDraft("dueDate", event.target.value)}
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: "var(--text-muted)" }}
              />
            </MetaRow>
          </div>

          <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-3 flex rounded-md border p-[2px]" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                className="flex-1 rounded px-2 py-1 text-xs"
                style={{
                  backgroundColor: activeTab === "description" ? "var(--bg-overlay)" : "transparent",
                  color: activeTab === "description" ? "var(--text-primary)" : "var(--text-muted)",
                }}
                onClick={() => setActiveTab("description")}
              >
                Description
              </button>
              <button
                type="button"
                className="flex-1 rounded px-2 py-1 text-xs"
                style={{
                  backgroundColor: activeTab === "activity" ? "var(--bg-overlay)" : "transparent",
                  color: activeTab === "activity" ? "var(--text-primary)" : "var(--text-muted)",
                }}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
            </div>

            {activeTab === "description" ? (
              <p className="text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                {draft.description || "No description provided."}
              </p>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={activityInput}
                  onChange={(event) => setActivityInput(event.target.value)}
                  className="min-h-24 w-full resize-none rounded-md border px-2 py-2 text-xs outline-none"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-base)",
                    color: "var(--text-muted)",
                  }}
                  placeholder="Leave a comment..."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
                    onClick={() => setActivityInput("")}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t p-3" style={{ borderColor: "var(--border)" }}>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>
            {project?.identifier ?? "---"}
          </span>
          {isCreating ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
                onClick={handleCreate}
              >
                Create Issue
              </button>
            </div>
          ) : (
            <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
              Live updates enabled
            </span>
          )}
        </footer>
      </div>
    </motion.aside>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[22px_80px_minmax(0,1fr)] items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-[var(--text-dim)]" />
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <div className="min-w-0" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </div>
  );
}
