"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FolderKanban,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { CURRENT_USER, PROJECTS, TASKS } from "@/data";
import type { Status, Task } from "@/types";
import { statusLabels } from "@/lib/task-utils";
import { readStoredTasks } from "@/lib/workspace-storage";

const profile = {
  name: CURRENT_USER.name,
  initials: CURRENT_USER.initials,
  email: "lena.brooks@orbit.local",
  role: "Workspace admin",
  plan: "Pro plan",
  timezone: "Europe/Belgrade",
  joined: "January 2026",
  workspace: "Orbit Product",
};

const statusSummary: { status: Status; label: string }[] = [
  { status: "todo", label: "Queued" },
  { status: "in-progress", label: "Active" },
  { status: "in-review", label: "Reviewing" },
  { status: "done", label: "Completed" },
];

function formatDate(date?: string) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function taskProject(task: Task) {
  return PROJECTS.find((project) => project.id === task.projectId);
}

export default function ProfilePage() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const ownedTasks = useMemo(
    () => tasks.filter((task) => task.assignee?.id === CURRENT_USER.id),
    [tasks]
  );
  const activeCount = ownedTasks.filter((task) => task.status !== "done" && task.status !== "cancelled").length;
  const reviewCount = ownedTasks.filter((task) => task.status === "in-review").length;
  const completedCount = ownedTasks.filter((task) => task.status === "done").length;
  const upcomingTasks = useMemo(
    () =>
      ownedTasks
        .filter((task) => task.dueDate && task.status !== "done" && task.status !== "cancelled")
        .sort((a, b) => new Date(a.dueDate ?? "").getTime() - new Date(b.dueDate ?? "").getTime())
        .slice(0, 3),
    [ownedTasks]
  );

  useEffect(() => {
    setTasks(readStoredTasks());
  }, []);

  return (
    <main className="h-screen overflow-auto" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-5 py-4">
        <header
          className="flex h-14 items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-md border text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              style={{ borderColor: "var(--border)" }}
              aria-label="Back to workspace"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Profile
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Account, workspace access, and personal issue load
              </p>
            </div>
          </div>

          <div
            className="flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Active session
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-5 py-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "#29304a", color: "#dbe2ff" }}
                >
                  {profile.initials}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {profile.name}
                  </h2>
                  <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    {profile.role}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <ProfileRow icon={Mail} label="Email" value={profile.email} />
                <ProfileRow icon={Building2} label="Workspace" value={profile.workspace} />
                <ProfileRow icon={Clock3} label="Timezone" value={profile.timezone} />
                <ProfileRow icon={CalendarDays} label="Joined" value={profile.joined} />
              </div>
            </section>

            <section
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <h2 className="mb-3 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Access
              </h2>
              <div className="space-y-2">
                <ProfileRow icon={ShieldCheck} label="Role" value={profile.role} />
                <ProfileRow icon={CreditCard} label="Plan" value={profile.plan} />
                <ProfileRow icon={Bell} label="Notifications" value="Mentions and assignments" />
              </div>
            </section>
          </aside>

          <div className="min-w-0 space-y-4">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Metric label="Assigned" value={ownedTasks.length} />
              <Metric label="Active" value={activeCount} />
              <Metric label="In review" value={reviewCount} />
            </section>

            <section
              className="rounded-lg border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex h-11 items-center justify-between border-b px-3" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Workload
                </h2>
                <span className="font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
                  {completedCount} completed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-0 md:grid-cols-4">
                {statusSummary.map((entry) => {
                  const count = ownedTasks.filter((task) => task.status === entry.status).length;
                  return (
                    <div key={entry.status} className="border-r px-3 py-3 last:border-r-0" style={{ borderColor: "var(--border)" }}>
                      <span className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                        {entry.label}
                      </span>
                      <span className="mt-1 block text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        {count}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {statusLabels[entry.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section
              className="rounded-lg border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex h-11 items-center justify-between border-b px-3" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Upcoming assigned issues
                </h2>
                <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  View workspace
                </Link>
              </div>
              <div>
                {upcomingTasks.map((task) => {
                  const project = taskProject(task);
                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 border-b px-3 py-2 text-xs last:border-b-0 md:grid-cols-[76px_minmax(0,1fr)_96px_76px]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {task.identifier}
                      </span>
                      <span className="truncate" style={{ color: "var(--text-primary)" }}>
                        {task.title}
                      </span>
                      <span className="hidden truncate md:block" style={{ color: "var(--text-muted)" }}>
                        {project?.name ?? "No project"}
                      </span>
                      <span className="hidden font-mono text-[10px] md:block" style={{ color: "var(--text-muted)" }}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <h2 className="mb-3 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Preferences
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Preference icon={UserRound} title="Default view" value="All Issues, list view" />
                <Preference icon={FolderKanban} title="Project scope" value="Atlas first for new issues" />
                <Preference icon={Bell} title="Notify on" value="Assignments, mentions, reviews" />
                <Preference icon={CheckCircle2} title="Availability" value="Online for workspace updates" />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[18px_74px_minmax(0,1fr)] items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-[var(--text-dim)]" />
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="truncate" style={{ color: "var(--text-muted)" }}>
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-3 py-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}>
      <span className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <span className="mt-1 block text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function Preference({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-md border px-3 py-2" style={{ borderColor: "var(--border)" }}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-dim)]" />
      <div className="min-w-0">
        <span className="block text-xs" style={{ color: "var(--text-primary)" }}>
          {title}
        </span>
        <span className="block truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
          {value}
        </span>
      </div>
    </div>
  );
}
