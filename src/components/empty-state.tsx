import { Layers } from "lucide-react";

type EmptyStateProps = {
  onCreateIssue: () => void;
};

export function EmptyState({ onCreateIssue }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-muted)",
          }}
        >
          <Layers className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          No issues yet
        </h3>
        <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
          Create your first issue and start moving work from backlog to done.
        </p>
        <button
          type="button"
          onClick={onCreateIssue}
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
        >
          + Create Issue
        </button>
      </div>
    </div>
  );
}