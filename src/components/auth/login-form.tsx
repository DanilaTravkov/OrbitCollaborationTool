"use client";

import { FormEvent, useState } from "react";
import { Chrome, Github, LockKeyhole, LogIn, Mail } from "lucide-react";

type LoginFormProps = {
  onToast: (message: string) => void;
  onLogin: (email: string) => void;
};

export function LoginForm({ onToast, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(email);
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
            placeholder="Enter password"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
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
        <LogIn className="h-4 w-4" />
        Login
      </button>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          onClick={() => onToast("Login with GitHub is not implemented yet.")}
        >
          <Github className="h-4 w-4" />
          GitHub
        </button>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          onClick={() => onToast("Login with Google is not implemented yet.")}
        >
          <Chrome className="h-4 w-4" />
          Google
        </button>
      </div>
    </form>
  );
}
