import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { threadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { threadId } = body;

  if (!threadId || typeof threadId !== "string") {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  // Verify user is a participant in this thread
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id, buyer_id, seller_id")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const isParticipant = thread.buyer_id === user.id || thread.seller_id === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Upsert the read status
  const { error: upsertError } = await supabase
    .from("thread_read_status")
    .upsert(
      {
        thread_id: threadId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "thread_id,user_id",
      }
    );

  if (upsertError) {
    console.error("Error updating read status:", upsertError);
    return NextResponse.json({ error: "Failed to update read status" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
