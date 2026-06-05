"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  CircleEllipsis,
  ExternalLink,
  Flag,
  Link2,
  Send,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { Priority, Project, Status, Task, Assignee, TaskComment } from "@/types";
import { priorityLabels, statusLabels } from "@/lib/task-utils";

type TaskDetailPanelProps = {
  task: Task | null;
  isCreating: boolean;
  projects: Project[];
  assignees: Assignee[];
  currentUser: Assignee;
  availableTasks: Task[];
  nextIdentifier: string;
  initialStatus?: Status;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, "id" | "identifier" | "createdAt">) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
};

type EditableTask = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: Assignee | null;
  labels: string[];
  linkedIssueIds: string[];
  dueDate?: string;
  projectId: string;
};

type DropdownKey = "status" | "priority" | "assignee" | "project" | "actions" | null;
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

function normalizeLabels(labels: string[]) {
  return Array.from(new Set(labels.map((label) => label.trim()).filter(Boolean)));
}

function parseLabels(value: string) {
  return normalizeLabels(value.split(","));
}

function toDraft(task: Task | null, defaults: { assignee: Assignee | null; projectId: string; status: Status }): EditableTask {
  if (!task) {
    return {
      title: "",
      description: "",
      status: defaults.status,
      priority: "medium",
      assignee: defaults.assignee,
      labels: [],
      linkedIssueIds: [],
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
    linkedIssueIds: task.linkedIssueIds ?? [],
    dueDate: task.dueDate ?? "",
    projectId: task.projectId,
  };
}

export function TaskDetailPanel({
  task,
  isCreating,
  projects,
  assignees,
  currentUser,
  availableTasks,
  nextIdentifier,
  initialStatus,
  onClose,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>("description");
  const [labelsInput, setLabelsInput] = useState("");
  const [activityInput, setActivityInput] = useState("");
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
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
    setActivityInput("");
    setDeleteConfirming(false);
    setOpenDropdown(null);
    setFullViewOpen(false);
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
  const linkableTasks = useMemo(
    () => availableTasks.filter((entry) => entry.id !== task?.id),
    [availableTasks, task?.id]
  );
  const linkedTasks = useMemo(
    () => linkableTasks.filter((entry) => draft.linkedIssueIds.includes(entry.id)),
    [draft.linkedIssueIds, linkableTasks]
  );
  const comments = task?.comments ?? [];
  const popularLabels = useMemo(() => {
    const counts = new Map<string, number>();

    availableTasks
      .filter((entry) => entry.projectId === draft.projectId)
      .flatMap((entry) => entry.labels)
      .forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));

    return Array.from(counts.entries())
      .sort(([labelA, countA], [labelB, countB]) => countB - countA || labelA.localeCompare(labelB))
      .map(([label]) => label);
  }, [availableTasks, draft.projectId]);

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
      linkedIssueIds: nextDraft.linkedIssueIds,
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
    const parsed = parseLabels(labelsInput);
    updateDraft("labels", parsed);
    setLabelsInput(parsed.join(", "));
  }

  function handleCreate() {
    const labels = normalizeLabels([...draft.labels, ...parseLabels(labelsInput)]);

    if (!draft.title.trim()) {
      return;
    }

    onCreateTask({
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: draft.status,
      priority: draft.priority,
      assignee: draft.assignee,
      labels,
      linkedIssueIds: draft.linkedIssueIds,
      dueDate: draft.dueDate || undefined,
      projectId: draft.projectId,
    });
  }

  function toggleLabel(label: string) {
    const currentLabels = normalizeLabels([...draft.labels, ...parseLabels(labelsInput)]);
    const labels = currentLabels.includes(label)
      ? currentLabels.filter((entry) => entry !== label)
      : [...currentLabels, label];

    updateDraft("labels", labels);
    setLabelsInput(labels.join(", "));
  }

  function toggleLinkedIssue(taskId: string) {
    updateDraft(
      "linkedIssueIds",
      draft.linkedIssueIds.includes(taskId)
        ? draft.linkedIssueIds.filter((entry) => entry !== taskId)
        : [...draft.linkedIssueIds, taskId]
    );
  }

  function handleDelete() {
    if (!task || isCreating) {
      return;
    }

    onDeleteTask(task.id);
  }

  function handleAddComment() {
    const body = activityInput.trim();

    if (!task || isCreating || !body) {
      return;
    }

    const nextComment: TaskComment = {
      id: `comment-${Date.now().toString(36)}`,
      body,
      author: currentUser,
      createdAt: new Date().toISOString(),
    };

    onUpdateTask({
      ...task,
      comments: [...(task.comments ?? []), nextComment],
    });
    setActivityInput("");
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

  function DropdownOption({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
      <button
        type="button"
        className="block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-overlay)]"
        style={{ color: "var(--text-primary)" }}
        onClick={() => {
          onClick();
          setOpenDropdown(null);
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.aside
      key="detail-panel"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute right-0 top-0 z-20 h-full w-[440px] max-w-[calc(100vw-220px)] border-l shadow-2xl"
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
            {isCreating ? (
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                onClick={() => setFullViewOpen(true)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Full view
              </button>
            ) : null}
            {!isCreating ? (
              <div className="relative">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                  aria-label="Issue actions"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === "actions" ? null : "actions"));
                    setDeleteConfirming(false);
                  }}
                >
                  <CircleEllipsis className="h-4 w-4" />
                </button>

                {openDropdown === "actions" ? (
                  <div
                    className="absolute right-0 z-30 mt-2 w-48 rounded-md border p-2"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg-elevated)",
                      boxShadow: "0 18px 36px rgba(0,0,0,0.35)",
                    }}
                  >
                    {deleteConfirming ? (
                      <div className="space-y-2">
                        <p className="px-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                          Delete this issue permanently?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="h-8 flex-1 rounded-md border text-xs"
                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            onClick={() => setDeleteConfirming(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="h-8 flex-1 rounded-md text-xs font-medium"
                            style={{ backgroundColor: "#dc2626", color: "#fff1f2" }}
                            onClick={handleDelete}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs"
                        style={{ color: "#fca5a5" }}
                        onClick={() => setDeleteConfirming(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete issue
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
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
              <div className="space-y-2">
                <input
                  value={labelsInput}
                  onChange={(event) => setLabelsInput(event.target.value)}
                  onBlur={handleLabelsBlur}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-[var(--text-dim)]"
                  style={{ color: "var(--accent)" }}
                  placeholder="comma, separated, labels"
                />
                <PopularLabelChips
                  labels={popularLabels}
                  selectedLabels={normalizeLabels([...draft.labels, ...parseLabels(labelsInput)])}
                  maxVisible={3}
                  onSelect={toggleLabel}
                />
              </div>
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

          <LinkedIssuesEditor
            linkedTasks={linkedTasks}
            linkableTasks={linkableTasks}
            linkedIssueIds={draft.linkedIssueIds}
            onToggle={toggleLinkedIssue}
            compact
          />

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
                Activity{comments.length ? ` ${comments.length}` : ""}
              </button>
            </div>

            {activeTab === "description" ? (
              <p className="text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                {draft.description || "No description provided."}
              </p>
            ) : (
              <div className="space-y-2">
                <CommentTimeline comments={comments} />
                <textarea
                  value={activityInput}
                  onChange={(event) => setActivityInput(event.target.value)}
                  disabled={isCreating}
                  className="min-h-24 w-full resize-none rounded-md border px-2 py-2 text-xs outline-none"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-base)",
                    color: "var(--text-muted)",
                  }}
                  placeholder={isCreating ? "Create the issue before adding comments." : "Leave a comment..."}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isCreating || !activityInput.trim()}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
                    onClick={handleAddComment}
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

        {isCreating && fullViewOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-5 py-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setFullViewOpen(false);
              }
            }}
          >
            <section
              className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-surface)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="flex h-14 items-center justify-between border-b px-4" style={{ borderColor: "var(--border)" }}>
                <div className="min-w-0">
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
                    {identifier}
                  </span>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Create issue
                  </h2>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                  onClick={() => setFullViewOpen(false)}
                  aria-label="Close full view"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto lg:grid-cols-[minmax(0,1fr)_310px] lg:overflow-hidden">
                <div className="min-w-0 overflow-auto p-4">
                  <textarea
                    value={draft.title}
                    onChange={(event) => updateDraft("title", event.target.value)}
                    placeholder="Issue title"
                    className="min-h-12 w-full resize-none border-none bg-transparent p-0 text-2xl font-semibold outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />

                  <div className="mt-4">
                    <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                      Description
                    </span>
                    <textarea
                      value={draft.description}
                      onChange={(event) => updateDraft("description", event.target.value)}
                      placeholder="Add enough detail for a teammate to pick this up."
                      className="min-h-56 w-full resize-none rounded-md border px-3 py-3 text-sm outline-none"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--bg-base)",
                        color: "var(--text-muted)",
                      }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                        Labels
                      </span>
                      <input
                        value={labelsInput}
                        onChange={(event) => setLabelsInput(event.target.value)}
                        onBlur={handleLabelsBlur}
                        className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none placeholder:text-[var(--text-dim)]"
                        style={{ borderColor: "var(--border)", color: "var(--accent)" }}
                        placeholder="Backend, Bug, Sprint"
                      />
                      <div className="mt-2">
                        <PopularLabelChips
                          labels={popularLabels}
                          selectedLabels={normalizeLabels([...draft.labels, ...parseLabels(labelsInput)])}
                          maxVisible={10}
                          onSelect={toggleLabel}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                        Due date
                      </span>
                      <input
                        type="date"
                        value={draft.dueDate ?? ""}
                        onChange={(event) => updateDraft("dueDate", event.target.value)}
                        className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      />
                    </div>
                  </div>
                </div>

                <aside className="min-w-0 overflow-auto border-t p-4 lg:border-l lg:border-t-0" style={{ borderColor: "var(--border)" }}>
                  <div className="grid grid-cols-1 gap-3">
                    <DropdownButton name="Status" value={statusLabels[draft.status]} dropdownKey="status">
                      {statusOptions.map((status) => (
                        <DropdownOption key={status} onClick={() => updateDraft("status", status)}>
                          {statusLabels[status]}
                        </DropdownOption>
                      ))}
                    </DropdownButton>

                    <DropdownButton name="Priority" value={priorityLabels[draft.priority]} dropdownKey="priority">
                      {priorityOptions.map((priority) => (
                        <DropdownOption key={priority} onClick={() => updateDraft("priority", priority)}>
                          {priorityLabels[priority]}
                        </DropdownOption>
                      ))}
                    </DropdownButton>

                    <DropdownButton
                      name="Assignee"
                      value={draft.assignee?.name ?? "Unassigned"}
                      dropdownKey="assignee"
                    >
                      <DropdownOption onClick={() => updateDraft("assignee", null)}>Unassigned</DropdownOption>
                      {assignees.map((member) => (
                        <DropdownOption key={member.id} onClick={() => updateDraft("assignee", member)}>
                          {member.name}
                        </DropdownOption>
                      ))}
                    </DropdownButton>

                    <DropdownButton name="Project" value={project?.name ?? "None"} dropdownKey="project">
                      {projects.map((entry) => (
                        <DropdownOption key={entry.id} onClick={() => updateDraft("projectId", entry.id)}>
                          {entry.name}
                        </DropdownOption>
                      ))}
                    </DropdownButton>
                  </div>

                  <LinkedIssuesEditor
                    linkedTasks={linkedTasks}
                    linkableTasks={linkableTasks}
                    linkedIssueIds={draft.linkedIssueIds}
                    onToggle={toggleLinkedIssue}
                  />
                </aside>
              </div>

              <footer className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Linked issues and side-panel fields stay in sync.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1.5 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    onClick={() => setFullViewOpen(false)}
                  >
                    Back to sidebar
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
              </footer>
            </section>
          </div>
        ) : null}
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

function PopularLabelChips({
  labels,
  selectedLabels,
  maxVisible,
  onSelect,
}: {
  labels: string[];
  selectedLabels: string[];
  maxVisible: number;
  onSelect: (label: string) => void;
}) {
  const visibleLabels = labels.slice(0, maxVisible);

  if (!visibleLabels.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visibleLabels.map((label) => {
        const selected = selectedLabels.includes(label);

        return (
          <button
            key={label}
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: selected ? "var(--accent)" : "#1d2030",
              color: selected ? "#edf0ff" : "var(--text-muted)",
            }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(label)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function formatCommentDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function CommentTimeline({ comments }: { comments: TaskComment[] }) {
  if (!comments.length) {
    return (
      <p className="rounded-md border px-2 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        No comments yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="rounded-md border px-2 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
        >
          <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
                style={{ backgroundColor: comment.author.color, color: "#eef0ff" }}
              >
                {comment.author.initials}
              </span>
              <span className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {comment.author.name}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
              {formatCommentDate(comment.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-5" style={{ color: "var(--text-muted)" }}>
            {comment.body}
          </p>
        </article>
      ))}
    </div>
  );
}

function LinkedIssuesEditor({
  linkedTasks,
  linkableTasks,
  linkedIssueIds,
  onToggle,
  compact = false,
}: {
  linkedTasks: Task[];
  linkableTasks: Task[];
  linkedIssueIds: string[];
  onToggle: (taskId: string) => void;
  compact?: boolean;
}) {
  return (
    <section className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          <Link2 className="h-3.5 w-3.5 text-[var(--text-dim)]" />
          Linked issues
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
          {linkedIssueIds.length}
        </span>
      </div>

      <div className="space-y-1">
        {linkedTasks.length ? (
          linkedTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className="grid h-8 w-full grid-cols-[64px_minmax(0,1fr)_52px] items-center gap-2 rounded-md border px-2 text-left text-[11px]"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              onClick={() => onToggle(task.id)}
            >
              <span className="font-mono text-[10px]">{task.identifier}</span>
              <span className="truncate" style={{ color: "var(--text-primary)" }}>
                {task.title}
              </span>
              <span className="text-right text-[10px]">Remove</span>
            </button>
          ))
        ) : (
          <p className="rounded-md border px-2 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            No linked issues yet.
          </p>
        )}
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          Add links
        </span>
        <div className={`space-y-1 overflow-auto pr-1 ${compact ? "max-h-36" : "max-h-64"}`}>
          {linkableTasks.map((task) => {
            const linked = linkedIssueIds.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                className="grid h-8 w-full grid-cols-[64px_minmax(0,1fr)_58px] items-center gap-2 rounded px-2 text-left text-[11px] hover:bg-[var(--bg-overlay)]"
                style={{
                  color: linked ? "var(--text-primary)" : "var(--text-muted)",
                  backgroundColor: linked ? "var(--bg-overlay)" : "transparent",
                }}
                onClick={() => onToggle(task.id)}
              >
                <span className="font-mono text-[10px]">{task.identifier}</span>
                <span className="truncate">{task.title}</span>
                <span className="text-right text-[10px]">{linked ? "Linked" : "Link"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
