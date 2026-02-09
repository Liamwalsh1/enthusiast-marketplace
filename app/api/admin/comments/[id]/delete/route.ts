import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
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

  // Parse request for optional flag ID
  let body: { flagId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body is okay
  }

  // Soft-delete the comment (set is_deleted to true)
  const { error: commentError } = await supabase
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", commentId);

  if (commentError) {
    console.error("Failed to delete comment:", commentError);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }

  // If a flagId was provided, mark the flag as reviewed
  if (body.flagId) {
    const { error: flagError } = await supabase
      .from("comment_flags")
      .update({
        status: "reviewed",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.flagId);

    if (flagError) {
      console.error("Failed to update flag:", flagError);
      // Don't fail the request, the comment was already deleted
    }
  }

  return NextResponse.json({ success: true });
}
