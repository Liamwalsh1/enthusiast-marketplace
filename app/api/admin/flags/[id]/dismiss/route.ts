import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: flagId } = await params;
  const supabase = await createServerSupabaseClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if current user is admin
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update the flag to dismissed
  const { error } = await supabase
    .from("comment_flags")
    .update({
      status: "dismissed",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", flagId);

  if (error) {
    console.error("Failed to dismiss flag:", error);
    return NextResponse.json({ error: "Failed to dismiss flag" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
