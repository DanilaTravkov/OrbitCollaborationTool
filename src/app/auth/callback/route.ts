import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/server";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const url = new URL("/auth", request.url);
  url.searchParams.set("activation", "error");
  url.searchParams.set("message", "Unable to finish authentication.");
  return NextResponse.redirect(url);
}
