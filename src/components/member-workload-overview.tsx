"use client";

import { AlertTriangle, Clock3, ListChecks, UserRound } from "lucide-react";
import type { MemberWorkload } from "@/lib/workspace-views";

type MemberWorkloadOverviewProps = {
  title: string;
  description: string;
  members: MemberWorkload[];
  totalIssueCount: number;
  loading?: boolean;
};

export function MemberWorkloadOverview({
  title,
  description,
  members,
  totalIssueCount,
  loading = false,
}: MemberWorkloadOverviewProps) {
  const activeTotal = members.reduce((sum, member) => sum + member.activeCount, 0);
  const reviewTotal = members.reduce((sum, member) => sum + member.reviewCount, 0);
  const overdueTotal = members.reduce((sum, member) => sum + member.overdueCount, 0);

  return (
    <section className="flex h-[calc(100dvh-220px)] min-h-[520px] min-w-0 flex-1 flex-col lg:h-full lg:min-h-0" style={{ backgroundColor: "var(--bg-base)" }}>
      <header
        className="flex min-h-14 flex-col items-start justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center"
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

      <div className="grid grid-cols-1 border-b sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
        <Metric icon={ListChecks} label="Active" value={activeTotal} loading={loading} />
        <Metric icon={Clock3} label="In review" value={reviewTotal} loading={loading} />
        <Metric icon={AlertTriangle} label="Overdue" value={overdueTotal} loading={loading} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[560px]">
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

          {loading ? (
            Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`member-skeleton-${index}`}
                className="grid min-h-12 grid-cols-[minmax(160px,1fr)_80px_80px_80px_80px] items-center gap-3 border-b px-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 animate-pulse rounded-full bg-[#1d2030]" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-28 animate-pulse rounded bg-[#1d2030]" />
                    <div className="h-2.5 w-16 animate-pulse rounded bg-[#151824]" />
                  </div>
                </div>
                {Array.from({ length: 4 }).map((__, cellIndex) => (
                  <div key={`member-skeleton-${index}-${cellIndex}`} className="ml-auto h-3 w-8 animate-pulse rounded bg-[#151824]" />
                ))}
              </div>
            ))
          ) : members.map((member) => (
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
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  loading = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-r px-4 py-3 last:border-r-0" style={{ borderColor: "var(--border)" }}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--text-dim)]" />
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
        {loading ? (
          <span className="mt-1 block h-4 w-8 animate-pulse rounded bg-[#1d2030]" />
        ) : (
          <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {value}
          </span>
        )}
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
