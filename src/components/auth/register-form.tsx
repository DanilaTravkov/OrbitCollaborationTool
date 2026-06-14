"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, Mail, UserPlus } from "lucide-react";
import type { EmailSignUpResult } from "@/lib/supabase/auth";
import { InlineSpinner } from "@/components/inline-spinner";

type RegisterFormProps = {
  onToast: (message: string, variant?: "info" | "error") => void;
  onRegister: (email: string, password: string) => Promise<EmailSignUpResult>;
};

export function RegisterForm({ onToast, onRegister }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && confirmPassword !== password,
    [confirmPassword, password]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (password !== confirmPassword) {
      onToast("Confirm password must match password exactly.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const result = await onRegister(email, password);
      if (result.confirmationRequired) {
        setConfirmationEmail(result.email);
      }
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Registration failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(99,102,241,0.16)", color: "var(--accent)" }}
        >
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Activate your account
        </h3>
        <p className="mt-2 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
          We sent an activation link to {confirmationEmail}. Open it to confirm the account, then log in.
        </p>
        <button
          type="button"
          className="mt-4 h-9 rounded-md border px-3 text-xs font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          onClick={() => setConfirmationEmail(null)}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          Email
        </label>
        <div
          className="flex h-10 items-center gap-2 rounded-md border px-3"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
        >
          <Mail className="h-4 w-4 text-[var(--text-dim)]" />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          Password
        </label>
        <div
          className="flex h-10 items-center gap-2 rounded-md border px-3"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
        >
          <LockKeyhole className="h-4 w-4 text-[var(--text-dim)]" />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create password"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          Confirm password
        </label>
        <div
          className="flex h-10 items-center gap-2 rounded-md border px-3"
          style={{
            borderColor: passwordMismatch || (submitted && password !== confirmPassword) ? "#ef4444" : "var(--border)",
            backgroundColor: "var(--bg-base)",
          }}
        >
          <LockKeyhole className="h-4 w-4 text-[var(--text-dim)]" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        {passwordMismatch || (submitted && password !== confirmPassword) ? (
          <p className="text-xs" style={{ color: "#fca5a5" }}>
            Confirm password must be an exact copy of password.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold"
        style={{
          backgroundColor: "var(--accent)",
          color: "#edf0ff",
          boxShadow: "0 10px 22px rgba(99,102,241,0.24)",
          opacity: submitting ? 0.72 : 1,
        }}
      >
        {submitting ? <InlineSpinner /> : <UserPlus className="h-4 w-4" />}
        <span>{submitting ? "Creating account" : "Register"}</span>
      </button>
    </form>
  );
}
