import type { Assignee } from "@/types";

const AUTH_STORAGE_KEY = "orbit.auth.session.v1";
const sessionColors = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

export type AuthSession = {
  id: string;
  email: string;
  name: string;
  initials: string;
  color: string;
  createdAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsFromName(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

export function createAuthSession(email: string): AuthSession {
  const normalizedEmail = email.trim().toLowerCase();
  const name = nameFromEmail(normalizedEmail);

  return {
    id: normalizedEmail,
    email: normalizedEmail,
    name,
    initials: initialsFromName(name),
    color: sessionColors[hashString(normalizedEmail) % sessionColors.length],
    createdAt: new Date().toISOString(),
  };
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.email) &&
    isString(value.name) &&
    isString(value.initials) &&
    isString(value.color) &&
    isString(value.createdAt)
  );
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function authSessionToAssignee(session: AuthSession): Assignee {
  return {
    id: session.id,
    name: session.name,
    initials: session.initials,
    color: session.color,
  };
}
