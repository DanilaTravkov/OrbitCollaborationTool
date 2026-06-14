"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import {
  getCurrentAuthSession,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/lib/supabase/auth";
import { PrefetchLink } from "@/components/prefetch-link";
import { useRoutePrefetch } from "@/lib/route-prefetch";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const prefetchHome = useRoutePrefetch("/");
  const [mode, setMode] = useState<AuthMode>("login");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getCurrentAuthSession()
      .then((session) => {
        if (session) {
          router.replace("/");
        }
      })
      .catch(() => {
        // The auth form remains usable if the initial session check fails.
      });
  }, [router]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleLogin(email: string, password: string) {
    prefetchHome();
    await signInWithEmailPassword(email, password);
    router.push("/");
  }

  async function handleRegister(email: string, password: string) {
    prefetchHome();
    await signUpWithEmailPassword(email, password);
    setToast("Account created. Check your email if confirmation is enabled.");
    router.push("/");
  }

  return (
    <main className="h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-5 py-3">
        <header
          className="flex h-14 items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <PrefetchLink
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-md border text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              style={{ borderColor: "var(--border)" }}
              aria-label="Back to workspace"
            >
              <ArrowLeft className="h-4 w-4" />
            </PrefetchLink>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Orbit auth
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Sign in or create a workspace account
              </p>
            </div>
          </div>

          <div
            className="hidden h-8 items-center gap-1 rounded-md border px-2 text-xs sm:flex"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure access
          </div>
        </header>

        <section className="grid min-h-0 flex-1 items-center gap-5 py-5 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section
            className="h-[536px] w-full rounded-lg border px-6 py-6 sm:px-8"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
          >
            <div className="mb-5 flex rounded-md border p-[2px]" style={{ borderColor: "var(--border)" }}>
              {(["login", "register"] as AuthMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="h-8 flex-1 rounded text-xs font-medium capitalize"
                  style={{
                    backgroundColor: mode === option ? "var(--bg-overlay)" : "transparent",
                    color: mode === option ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                  onClick={() => setMode(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {mode === "login" ? "Login" : "Register"}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {mode === "login"
                  ? "Enter your email and password."
                  : "Confirm password must be an exact copy of password."}
              </p>
            </div>

            {mode === "login" ? (
              <LoginForm onToast={setToast} onLogin={handleLogin} />
            ) : (
              <RegisterForm onToast={setToast} onRegister={handleRegister} />
            )}
          </section>

          <aside
            className="flex h-[536px] flex-col justify-between overflow-hidden rounded-lg border px-6 py-6 sm:px-8"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
          >
            <div>
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-md"
                style={{
                  background:
                    "linear-gradient(145deg, var(--accent) 0%, #818cf8 45%, #312e81 100%)",
                  boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 24px rgba(99,102,241,0.25)",
                }}
              >
                <LockKeyhole className="h-5 w-5 text-[#eef0ff]" />
              </div>
              <h2 className="max-w-lg text-2xl font-semibold tracking-normal" style={{ color: "var(--text-primary)" }}>
                Access your Orbit workspace
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                Sign in to keep issue triage, project planning, workload visibility, and workspace activity connected
                across the same focused command center.
              </p>
            </div>

            <div className="my-4 grid gap-2 sm:grid-cols-2">
              <AuthBenefit
                icon={ShieldCheck}
                title="Protected workspace"
                description="Account access is separated from the task surface and ready for backend session handling."
              />
              <AuthBenefit
                icon={Fingerprint}
                title="Identity first"
                description="Email auth is available now, with social providers clearly marked until they are wired."
              />
              <AuthBenefit
                icon={Users}
                title="Team context"
                description="Profiles, assignees, projects, and member workload stay tied to the active account."
              />
              <AuthBenefit
                icon={Bell}
                title="Future signals"
                description="The page has space for notifications, invites, and access prompts as auth grows."
              />
            </div>

            <div
              className="grid gap-3 rounded-md border p-3 sm:grid-cols-[32px_minmax(0,1fr)]"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ backgroundColor: "var(--bg-overlay)", color: "var(--accent)" }}
              >
                <KeyRound className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Social sign-in status
                </h3>
                <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                  GitHub and Google actions intentionally show toast feedback until OAuth routes are implemented.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-32px))]">
          <div
            className="flex items-start gap-3 rounded-lg border px-3 py-3"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-elevated)",
              boxShadow: "0 18px 42px rgba(0,0,0,0.42)",
            }}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <p className="min-w-0 flex-1 text-sm leading-5" style={{ color: "var(--text-primary)" }}>
              {toast}
            </p>
            <button
              type="button"
              className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              onClick={() => setToast(null)}
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function AuthBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 gap-2 rounded-md border p-2.5" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-muted)" }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] leading-4" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
