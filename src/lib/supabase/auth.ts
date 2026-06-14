"use client";

import type { User } from "@supabase/supabase-js";
import { createAuthSession } from "@/lib/auth-storage";
import type { AuthSession } from "@/lib/auth-storage";
import { createClient } from "@/lib/client";

export type EmailSignUpResult = {
  session: AuthSession | null;
  confirmationRequired: boolean;
  email: string;
};

function getAuthRedirectUrl(path: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${path}`;
}

export function userToAuthSession(user: User): AuthSession {
  return createAuthSession(user.email ?? user.id, {
    id: user.id,
    createdAt: user.created_at,
  });
}

export async function getCurrentAuthSession() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return userToAuthSession(user);
}

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Login succeeded but no user was returned.");
  }

  return userToAuthSession(data.user);
}

export async function signUpWithEmailPassword(email: string, password: string): Promise<EmailSignUpResult> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      emailRedirectTo: getAuthRedirectUrl("/auth/confirm?next=/"),
    }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Registration failed.";
    throw new Error(message);
  }

  return payload as EmailSignUpResult;
}

export async function signInWithOAuth(provider: "github" | "google") {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthRedirectUrl("/auth/callback?next=/"),
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
