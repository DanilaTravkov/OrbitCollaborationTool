"use client";

import { AlertTriangle, Clock3, ListChecks, UserRound } from "lucide-react";
import type { MemberWorkload } from "@/lib/workspace-views";

type MemberWorkloadOverviewProps = {
  title: string;
  description: string;
  members: MemberWorkload[];
  totalIssueCount: number;
};

export function MemberWorkloadOverview({
  title,
  description,
  members,
  totalIssueCount,
}: MemberWorkloadOverviewProps) {
  const activeTotal = members.reduce((sum, member) => sum + member.activeCount, 0);
  const reviewTotal = members.reduce((sum, member) => sum + member.reviewCount, 0);
  const overdueTotal = members.reduce((sum, member) => sum + member.overdueCount, 0);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <header
        className="flex min-h-14 items-center justify-between gap-3 border-b px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            <UserRound className="h-4 w-4" />
            <span className="truncate">{title}</span>
          </div>
          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
          {members.length} members / {totalIssueCount} issues
        </span>
      </header>

      <div className="grid grid-cols-3 border-b" style={{ borderColor: "var(--border)" }}>
        <Metric icon={ListChecks} label="Active" value={activeTotal} />
        <Metric icon={Clock3} label="In review" value={reviewTotal} />
        <Metric icon={AlertTriangle} label="Overdue" value={overdueTotal} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className="sticky top-0 z-10 grid h-8 grid-cols-[minmax(160px,1fr)_80px_80px_80px_80px] items-center gap-3 border-b px-4 text-[10px] uppercase tracking-[0.08em]"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-dim)",
            backgroundColor: "var(--bg-base)",
          }}
        >
          <span>Member</span>
          <span className="text-right">Assigned</span>
          <span className="text-right">Active</span>
          <span className="text-right">Review</span>
          <span className="text-right">Done</span>
        </div>

        {members.map((member) => (
          <div
            key={member.assignee.id}
            className="grid min-h-12 grid-cols-[minmax(160px,1fr)_80px_80px_80px_80px] items-center gap-3 border-b px-4 text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: member.assignee.color, color: "#eef0ff" }}
              >
                {member.assignee.initials}
              </span>
              <div className="min-w-0">
                <span className="block truncate font-medium" style={{ color: "var(--text-primary)" }}>
                  {member.assignee.name}
                </span>
                <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {member.overdueCount ? `${member.overdueCount} overdue` : "On track"}
                </span>
              </div>
            </div>
            <NumberCell value={member.assignedCount} />
            <NumberCell value={member.activeCount} />
            <NumberCell value={member.reviewCount} />
            <NumberCell value={member.completedCount} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-r px-4 py-3 last:border-r-0" style={{ borderColor: "var(--border)" }}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--text-dim)]" />
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
        <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function NumberCell({ value }: { value: number }) {
  return (
    <span className="font-mono text-[11px] text-right" style={{ color: "var(--text-muted)" }}>
      {value}
    </span>
  );
}
