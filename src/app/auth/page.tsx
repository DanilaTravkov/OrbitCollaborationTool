"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Fingerprint,
  Info,
  KeyRound,
  LockKeyhole,
  LoaderCircle,
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
type ToastVariant = "info" | "error";
type AuthToast = {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
};
const TOAST_EXIT_MS = 180;
const MAX_TOASTS = 3;

function createToastId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AuthPage() {
  const router = useRouter();
  const prefetchHome = useRoutePrefetch("/");
  const [mode, setMode] = useState<AuthMode>("login");
  const [toasts, setToasts] = useState<AuthToast[]>([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const toastsRef = useRef<AuthToast[]>([]);
  const pendingToastsRef = useRef<AuthToast[]>([]);
  const exitTimersRef = useRef<Map<string, number>>(new Map());
  const dismissTimersRef = useRef<Map<string, number>>(new Map());
  const dismissToastRef = useRef<(id: string) => void>(() => undefined);

  const setToastState = useCallback((nextToasts: AuthToast[]) => {
    toastsRef.current = nextToasts;
    setToasts(nextToasts);
  }, []);

  const startAutoDismiss = useCallback((toast: AuthToast) => {
    const timeout = window.setTimeout(() => {
      dismissToastRef.current(toast.id);
    }, toast.variant === "error" ? 5600 : 4200);

    dismissTimersRef.current.set(toast.id, timeout);
  }, []);

  const flushPendingToasts = useCallback(() => {
    let nextToasts = toastsRef.current;

    while (nextToasts.length < MAX_TOASTS && pendingToastsRef.current.length > 0) {
      const pendingToast = pendingToastsRef.current.shift();
      if (!pendingToast) {
        continue;
      }

      nextToasts = [...nextToasts, pendingToast];
      startAutoDismiss(pendingToast);
    }

    setToastState(nextToasts);

    if (pendingToastsRef.current.length > 0) {
      const oldestActive = nextToasts.find((toast) => !toast.exiting);
      if (oldestActive) {
        dismissToastRef.current(oldestActive.id);
      }
    }
  }, [setToastState, startAutoDismiss]);

  const dismissToast = useCallback((id: string) => {
    if (exitTimersRef.current.has(id)) {
      return;
    }

    const dismissTimer = dismissTimersRef.current.get(id);
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
      dismissTimersRef.current.delete(id);
    }

    setToastState(toastsRef.current.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)));

    const exitTimer = window.setTimeout(() => {
      exitTimersRef.current.delete(id);
      setToastState(toastsRef.current.filter((toast) => toast.id !== id));
      flushPendingToasts();
    }, TOAST_EXIT_MS);

    exitTimersRef.current.set(id, exitTimer);
  }, [flushPendingToasts, setToastState]);

  useEffect(() => {
    dismissToastRef.current = dismissToast;
  }, [dismissToast]);

  useEffect(() => {
    return () => {
      exitTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      dismissTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = createToastId();
      const nextToast: AuthToast = { id, message, variant };
      const currentToasts = toastsRef.current;

      if (currentToasts.length < MAX_TOASTS) {
        setToastState([...currentToasts, nextToast]);
        startAutoDismiss(nextToast);
      } else {
        pendingToastsRef.current.push(nextToast);
        const hasExitingToast = currentToasts.some((toast) => toast.exiting);
        const oldestActive = currentToasts.find((toast) => !toast.exiting);
        if (!hasExitingToast && oldestActive) {
          dismissToastRef.current(oldestActive.id);
        }
      }
    },
    [setToastState, startAutoDismiss]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activation = params.get("activation");
    const message = params.get("message");

    if (activation === "error") {
      addToast(message || "Unable to activate account.", "error");
    }

    if (activation) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [addToast]);

  useEffect(() => {
    getCurrentAuthSession()
      .then((session) => {
        if (session) {
          router.replace("/");
        }
      })
      .catch(() => {
        // The auth form remains usable if the initial session check fails.
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, [router]);

  async function handleLogin(email: string, password: string) {
    prefetchHome();
    await signInWithEmailPassword(email, password);
    router.push("/");
  }

  async function handleRegister(email: string, password: string) {
    prefetchHome();
    const result = await signUpWithEmailPassword(email, password);

    if (result.confirmationRequired) {
      addToast("Activation link sent. Confirm your email before logging in.");
      return result;
    }

    addToast("Account created.");
    router.push("/");
    return result;
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
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {mode === "login" ? "Login" : "Register"}
                </h2>
                {checkingSession ? (
                  <span
                    className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px]"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Checking
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {mode === "login"
                  ? "Enter your email and password."
                  : "Confirm password must be an exact copy of password."}
              </p>
            </div>

            {mode === "login" ? (
              <LoginForm onToast={addToast} onLogin={handleLogin} />
            ) : (
              <RegisterForm onToast={addToast} onRegister={handleRegister} />
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
                  GitHub and Google sign-ins use the Supabase callback route when providers are enabled.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: AuthToast[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
      {[...toasts].reverse().map((toast) => {
        const isError = toast.variant === "error";
        const Icon = isError ? AlertCircle : Info;

        return (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={toast.exiting ? { opacity: 0, y: 8, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: toast.exiting ? 0.18 : 0.22, ease: toast.exiting ? "easeIn" : "easeOut" }}
            className="flex items-start gap-3 rounded-lg border px-3 py-3"
            style={{
              borderColor: isError ? "rgba(239,68,68,0.58)" : "rgba(99,102,241,0.56)",
              backgroundColor: isError ? "#211014" : "var(--bg-elevated)",
              boxShadow: isError
                ? "0 18px 42px rgba(0,0,0,0.42), 0 0 0 1px rgba(239,68,68,0.16)"
                : "0 18px 42px rgba(0,0,0,0.42), 0 0 0 1px rgba(99,102,241,0.14)",
            }}
          >
            <div
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: isError ? "rgba(239,68,68,0.16)" : "rgba(99,102,241,0.16)",
                color: isError ? "#f87171" : "var(--accent)",
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="block text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: isError ? "#fca5a5" : "var(--text-dim)" }}
              >
                {isError ? "Error" : "Info"}
              </span>
              <p className="mt-0.5 text-sm leading-5" style={{ color: "var(--text-primary)" }}>
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              disabled={toast.exiting}
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        );
      })}
    </div>
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
