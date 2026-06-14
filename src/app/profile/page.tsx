"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Database, LogIn, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import {
  clearAuthSession,
  readAuthSession,
} from "@/lib/auth-storage";
import type { AuthSession } from "@/lib/auth-storage";

function formatSessionDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readAuthSession());
    setReady(true);
  }, []);

  function handleLogout() {
    clearAuthSession();
    setSession(null);
    router.push("/auth");
  }

  if (!ready) {
    return <main className="h-screen" style={{ backgroundColor: "var(--bg-base)" }} />;
  }

  if (!session) {
    return (
      <main className="flex h-screen items-center justify-center px-5" style={{ backgroundColor: "var(--bg-base)" }}>
        <section
          className="w-full max-w-md rounded-lg border px-6 py-7 text-center"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
        >
          <div
            className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-overlay)", color: "var(--accent)" }}
          >
            <UserRound className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            No account session
          </h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            Login or register before viewing account details.
          </p>
          <Link
            href="/auth"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)", color: "#edf0ff" }}
          >
            <LogIn className="h-4 w-4" />
            Go to auth
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-auto" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-5 py-4">
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
                Account
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Local session details awaiting Supabase integration
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </header>

        <section className="grid flex-1 items-start gap-5 py-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{ backgroundColor: session.color, color: "#eef0ff" }}
              >
                {session.initials}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {session.name}
                </h2>
                <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                  {session.email}
                </p>
              </div>
            </div>
          </aside>

          <section
            className="rounded-lg border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
          >
            <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Session
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                This is a temporary client-side session boundary for the upcoming Supabase API.
              </p>
            </div>
            <div className="grid gap-0">
              <ProfileRow icon={Mail} label="Email" value={session.email} />
              <ProfileRow icon={UserRound} label="Display name" value={session.name} />
              <ProfileRow icon={ShieldCheck} label="Auth state" value="Logged in locally" />
              <ProfileRow icon={Database} label="Profile source" value="Supabase not connected yet" />
              <ProfileRow icon={ShieldCheck} label="Created" value={formatSessionDate(session.createdAt)} />
            </div>
          </section>
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
    <div className="grid grid-cols-[22px_120px_minmax(0,1fr)] items-center gap-3 border-b px-4 py-3 text-xs last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <Icon className="h-3.5 w-3.5 text-[var(--text-dim)]" />
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="truncate" style={{ color: "var(--text-muted)" }}>
        {value}
      </span>
    </div>
  );
}
