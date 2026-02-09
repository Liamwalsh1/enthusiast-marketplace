import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  // Check if comment exists and get owner
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError || !comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  // Check admin role
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = userRole?.role === "admin";
  const isOwner = comment.user_id === user.id;

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized to delete this comment." }, { status: 403 });
  }

  // Soft delete - set is_deleted = true
  const { error: updateError } = await supabase
    .from("comments")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", commentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
