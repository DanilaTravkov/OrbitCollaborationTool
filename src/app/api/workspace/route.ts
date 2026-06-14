import { NextResponse } from "next/server";
import { getWorkspaceSnapshot } from "@/lib/supabase/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getWorkspaceSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace data.";
    return new NextResponse(message, { status: 500 });
  }
}
