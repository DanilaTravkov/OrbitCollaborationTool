"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Inbox,
  Layers2,
  LogOut,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Project } from "@/types";
import type { AuthSession } from "@/lib/auth-storage";
import { getSidebarSelectionId } from "@/lib/workspace-views";
import type { SidebarViewId } from "@/lib/workspace-views";
import { PrefetchLink } from "@/components/prefetch-link";

type SidebarProps = {
  projects: Project[];
  session: AuthSession;
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenCommandPalette: () => void;
  onLogout: () => void;
  loading?: boolean;
  loggingOut?: boolean;
};

const navItems: { id: SidebarViewId; label: string; icon: LucideIcon }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "my-issues", label: "My Issues", icon: Layers2 },
  { id: "all", label: "All Issues", icon: FolderKanban },
  { id: "cycles", label: "Cycles", icon: ChevronRight },
  { id: "members", label: "Members", icon: Users },
];

export function Sidebar({
  projects,
  session,
  selectedProjectId,
  onSelectProject,
  onOpenCommandPalette,
  onLogout,
  loading = false,
  loggingOut = false,
}: SidebarProps) {
  const [projectsOpen, setProjectsOpen] = useState(true);
  const activeNav = useMemo(() => {
    return getSidebarSelectionId(selectedProjectId);
  }, [selectedProjectId]);

  return (
    <aside
      className="flex h-full w-[220px] flex-col border-r px-3 py-3"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <div
          className="h-7 w-7 rounded-md"
          style={{
            background:
              "linear-gradient(145deg, var(--accent) 0%, #818cf8 45%, #312e81 100%)",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 24px rgba(99,102,241,0.25)",
          }}
        />
        <span className="text-sm font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
          Orbit
        </span>
      </div>

      <button
        className="mb-3 flex h-9 w-full items-center justify-between rounded-md border px-2 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        type="button"
        onClick={onOpenCommandPalette}
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Search
        </span>
        <span className="font-mono text-[10px] text-[var(--text-dim)]">Ctrl K</span>
      </button>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeNav;
          return (
            <button
              key={item.id}
              type="button"
              className="relative flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs"
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                backgroundColor: isActive ? "var(--bg-overlay)" : "transparent",
              }}
              onClick={() => onSelectProject(item.id)}
            >
              {isActive ? (
                <span
                  className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-sm"
                  style={{ backgroundColor: "var(--accent)" }}
                />
              ) : null}
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4">
        <button
          type="button"
          className="flex h-8 w-full items-center justify-between rounded-md px-2 text-xs"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setProjectsOpen((prev) => !prev)}
        >
          <span className="font-medium">Projects</span>
          {projectsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {projectsOpen ? (
          <div className="mt-1 space-y-1">
            {loading && projects.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`project-skeleton-${index}`} className="h-8 animate-pulse rounded bg-[#151824]" />
              ))
            ) : projects.map((project) => {
              const active = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  className="relative flex h-8 w-full items-center justify-between rounded-md px-2 text-xs"
                  style={{
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                    backgroundColor: active ? "var(--bg-overlay)" : "transparent",
                  }}
                  onClick={() => onSelectProject(project.id)}
                >
                  {active ? (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-sm"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  ) : null}
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="truncate">{project.name}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-dim)]">{project.identifier}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-auto">
        <div
          className="flex items-center justify-between rounded-lg border px-2 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
        >
          <PrefetchLink
            href="/profile"
            className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: session.color, color: "#eef0ff" }}
            >
              {session.initials}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {session.name}
              </span>
              <span className="truncate text-[10px]" style={{ color: "var(--text-muted)" }}>
                {session.email}
              </span>
            </div>
          </PrefetchLink>
          <button
            type="button"
            className="rounded-md p-1"
            style={{ color: "var(--text-muted)" }}
            aria-label="Logout"
            disabled={loggingOut}
            onClick={onLogout}
          >
            {loggingOut ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
