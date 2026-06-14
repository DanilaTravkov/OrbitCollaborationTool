"use client";

import { FormEvent, useMemo, useState } from "react";
import { LockKeyhole, Mail, UserPlus } from "lucide-react";

type RegisterFormProps = {
  onToast: (message: string) => void;
  onRegister: (email: string) => void;
};

export function RegisterForm({ onToast, onRegister }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && confirmPassword !== password,
    [confirmPassword, password]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (password !== confirmPassword) {
      onToast("Confirm password must match password exactly.");
      return;
    }

    onRegister(email);
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
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold"
        style={{
          backgroundColor: "var(--accent)",
          color: "#edf0ff",
          boxShadow: "0 10px 22px rgba(99,102,241,0.24)",
        }}
      >
        <UserPlus className="h-4 w-4" />
        Register
      </button>
    </form>
  );
}
