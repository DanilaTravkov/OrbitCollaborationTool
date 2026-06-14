"use client";

import type { User } from "@supabase/supabase-js";
import { createAuthSession } from "@/lib/auth-storage";
import type { AuthSession } from "@/lib/auth-storage";
import { createClient } from "@/lib/client";

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

export async function signUpWithEmailPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Signup succeeded but no user was returned.");
  }

  return userToAuthSession(data.user);
}

export async function signInWithOAuth(provider: "github" | "google") {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
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
