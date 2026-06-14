import { NextResponse, type NextRequest } from "next/server";
import type { AuthSession } from "@/lib/auth-storage";
import { createAuthSession } from "@/lib/auth-storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/server";

type RegisterRequestBody = {
  email?: unknown;
  password?: unknown;
  emailRedirectTo?: unknown;
};

type RegisterResponseBody = {
  session: AuthSession | null;
  confirmationRequired: boolean;
  email: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidRedirect(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function emailExists(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("auth_user_profiles")
    .select("id")
    .ilike("email", email)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
}

export async function POST(request: NextRequest) {
  let body: RegisterRequestBody;

  try {
    body = (await request.json()) as RegisterRequestBody;
  } catch {
    return NextResponse.json({ message: "Invalid registration payload." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = body.password;
  const emailRedirectTo =
    typeof body.emailRedirectTo === "string" && isValidRedirect(body.emailRedirectTo)
      ? body.emailRedirectTo
      : undefined;

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    if (await emailExists(email)) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ message: "Signup succeeded but no user was returned." }, { status: 502 });
    }

    const responseBody: RegisterResponseBody = {
      session: data.session
        ? createAuthSession(data.user.email ?? data.user.id, {
            id: data.user.id,
            createdAt: data.user.created_at,
          })
        : null,
      confirmationRequired: !data.session,
      email: data.user.email ?? email,
    };

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 }
    );
  }
}
