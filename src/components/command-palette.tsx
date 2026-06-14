"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  Command,
  Folder,
  FolderKanban,
  Inbox,
  Layers2,
  LayoutGrid,
  LayoutList,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Project, Task } from "@/types";
import { emptyTaskFilters } from "@/lib/task-utils";
import type { TaskFilters } from "@/lib/task-utils";
import type { TaskViewMode } from "@/lib/workspace-storage";

type CommandPaletteProps = {
  open: boolean;
  tasks: Task[];
  projects: Project[];
  viewMode: TaskViewMode;
  activeFilters: boolean;
  onClose: () => void;
  onCreateIssue: () => void;
  onOpenTask: (task: Task) => void;
  onSelectWorkspace: (selectionId: string) => void;
  onViewModeChange: (mode: TaskViewMode) => void;
  onFiltersChange: (filters: TaskFilters) => void;
};

type CommandItem = {
  id: string;
  title: string;
  detail: string;
  keywords: string;
  icon: LucideIcon;
  kind: "action" | "issue" | "project" | "view";
  onSelect: () => void;
};

const staticViews: Array<{
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
}> = [
  { id: "inbox", title: "Go to Inbox", detail: "Unassigned and active assignments", icon: Inbox },
  { id: "my-issues", title: "Go to My Issues", detail: "Assigned to you", icon: Layers2 },
  { id: "all", title: "Go to All Issues", detail: "Every issue in the workspace", icon: FolderKanban },
  { id: "cycles", title: "Go to Cycles", detail: "Due-dated active issues", icon: CalendarClock },
  { id: "members", title: "Go to Members", detail: "Team workload overview", icon: Users },
];

function getProjectName(projects: Project[], task: Task) {
  return projects.find((project) => project.id === task.projectId)?.name ?? "Unknown project";
}

function itemMatches(item: CommandItem, query: string) {
  if (!query) {
    return true;
  }

  return item.keywords.includes(query);
}

export function CommandPalette({
  open,
  tasks,
  projects,
  viewMode,
  activeFilters,
  onClose,
  onCreateIssue,
  onOpenTask,
  onSelectWorkspace,
  onViewModeChange,
  onFiltersChange,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = useMemo<CommandItem[]>(() => {
    const actionItems: CommandItem[] = [
      {
        id: "action-create-issue",
        title: "Create issue",
        detail: "Open the issue composer",
        keywords: "create issue new task",
        icon: Plus,
        kind: "action",
        onSelect: onCreateIssue,
      },
      {
        id: "action-list-view",
        title: "Switch to list view",
        detail: viewMode === "list" ? "Current view" : "Compact grouped issue list",
        keywords: "list display view",
        icon: LayoutList,
        kind: "action",
        onSelect: () => onViewModeChange("list"),
      },
      {
        id: "action-board-view",
        title: "Switch to board view",
        detail: viewMode === "board" ? "Current view" : "Kanban drag-and-drop board",
        keywords: "board kanban display view",
        icon: LayoutGrid,
        kind: "action",
        onSelect: () => onViewModeChange("board"),
      },
    ];

    if (activeFilters) {
      actionItems.push({
        id: "action-clear-filters",
        title: "Clear filters",
        detail: "Reset search, status, priority, assignee, and due date",
        keywords: "clear reset filters search",
        icon: RotateCcw,
        kind: "action",
        onSelect: () => onFiltersChange(emptyTaskFilters),
      });
    }

    const viewItems = staticViews.map<CommandItem>((view) => ({
      id: `view-${view.id}`,
      title: view.title,
      detail: view.detail,
      keywords: `${view.title} ${view.detail}`.toLowerCase(),
      icon: view.icon,
      kind: "view",
      onSelect: () => onSelectWorkspace(view.id),
    }));

    const projectItems = projects.map<CommandItem>((project) => ({
      id: `project-${project.id}`,
      title: `Open ${project.name}`,
      detail: `${project.identifier} project issues`,
      keywords: `${project.name} ${project.identifier} project`.toLowerCase(),
      icon: Folder,
      kind: "project",
      onSelect: () => onSelectWorkspace(project.id),
    }));

    const issueItems = tasks.map<CommandItem>((task) => {
      const projectName = getProjectName(projects, task);

      return {
        id: `issue-${task.id}`,
        title: task.title,
        detail: `${task.identifier} - ${projectName}`,
        keywords: [
          task.identifier,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.assignee?.name ?? "unassigned",
          projectName,
          ...task.labels,
        ]
          .join(" ")
          .toLowerCase(),
        icon: Command,
        kind: "issue",
        onSelect: () => onOpenTask(task),
      };
    });

    return [...actionItems, ...viewItems, ...projectItems, ...issueItems];
  }, [
    activeFilters,
    onCreateIssue,
    onFiltersChange,
    onOpenTask,
    onSelectWorkspace,
    onViewModeChange,
    projects,
    tasks,
    viewMode,
  ]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => itemMatches(item, normalizedQuery)).slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
      return;
    }

    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex <= filteredItems.length - 1) {
      return;
    }

    setSelectedIndex(Math.max(filteredItems.length - 1, 0));
  }, [filteredItems.length, selectedIndex]);

  function runSelected(item: CommandItem) {
    item.onSelect();
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.section
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="w-full max-w-2xl overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--bg-surface)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-12 items-center gap-2 border-b px-3" style={{ borderColor: "var(--border)" }}>
          <Search className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                const selected = filteredItems[selectedIndex];
                if (selected) {
                  runSelected(selected);
                }
              }
            }}
            placeholder="Search issues or run a command"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            type="button"
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
            onClick={onClose}
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(520px,68vh)] overflow-auto p-2">
          {filteredItems.length ? (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const selected = index === selectedIndex;
              const currentView =
                (item.id === "action-list-view" && viewMode === "list") ||
                (item.id === "action-board-view" && viewMode === "board");

              return (
                <button
                  key={item.id}
                  type="button"
                  className="grid h-12 w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 text-left text-xs"
                  style={{
                    backgroundColor: selected ? "var(--bg-overlay)" : "transparent",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runSelected(item)}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ backgroundColor: selected ? "#222638" : "var(--bg-base)", color: "var(--text-muted)" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="block truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {item.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {currentView ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : null}
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] capitalize"
                      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-dim)" }}
                    >
                      {item.kind}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex h-28 items-center justify-center rounded-md border text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              No commands or issues match that search.
            </div>
          )}
        </div>

        <footer
          className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-[10px]"
          style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
        >
          <span className="font-mono">Enter to run</span>
          <span className="font-mono">Esc to close</span>
        </footer>
      </motion.section>
    </div>
  );
}
