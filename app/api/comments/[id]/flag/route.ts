import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

type FlagPayload = {
  reason?: string;
};

export async function POST(
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

  let payload: FlagPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reason = payload.reason?.trim();

  if (!reason) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
  }

  // Verify comment exists
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError || !comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  // Cannot flag own comment
  if (comment.user_id === user.id) {
    return NextResponse.json({ error: "You cannot flag your own comment." }, { status: 400 });
  }

  const trimmedReason = reason.slice(0, 500);

  const { data: flag, error: insertError } = await supabase
    .from("comment_flags")
    .insert({
      comment_id: commentId,
      flagged_by: user.id,
      reason: trimmedReason,
    })
    .select("id, comment_id, reason, created_at")
    .single();

  if (insertError) {
    // Check for unique constraint violation (already flagged)
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You have already flagged this comment." }, { status: 400 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ flag }, { status: 201 });
}
