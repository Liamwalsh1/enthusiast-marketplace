import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all threads where user is a participant
  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .select("id, last_message_at, buyer_id, seller_id")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (threadsError) {
    console.error("Error fetching threads:", threadsError);
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }

  if (!threads || threads.length === 0) {
    return NextResponse.json({ unreadCount: 0, unreadThreads: [] });
  }

  const threadIds = threads.map((t) => t.id);

  // Get read status for all threads
  const { data: readStatuses, error: readError } = await supabase
    .from("thread_read_status")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id)
    .in("thread_id", threadIds);

  if (readError) {
    console.error("Error fetching read status:", readError);
    return NextResponse.json({ error: "Failed to fetch read status" }, { status: 500 });
  }

  // Create a map of thread_id -> last_read_at
  const readMap = new Map<string, string>();
  (readStatuses ?? []).forEach((rs) => {
    readMap.set(rs.thread_id, rs.last_read_at);
  });

  // For each thread, check if there are messages newer than last_read_at
  // A thread is "unread" if:
  // 1. User has never read it (no entry in read status), OR
  // 2. last_message_at > last_read_at AND the last message wasn't sent by the user
  const unreadThreadIds: string[] = [];

  for (const thread of threads) {
    const lastReadAt = readMap.get(thread.id);

    if (!lastReadAt) {
      // Never read this thread - check if there are any messages from the other person
      const { data: hasOtherMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("thread_id", thread.id)
        .neq("sender_id", user.id)
        .limit(1);

      if (hasOtherMessages && hasOtherMessages.length > 0) {
        unreadThreadIds.push(thread.id);
      }
    } else {
      // Check if there are messages from others after last_read_at
      const { data: newMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("thread_id", thread.id)
        .neq("sender_id", user.id)
        .gt("created_at", lastReadAt)
        .limit(1);

      if (newMessages && newMessages.length > 0) {
        unreadThreadIds.push(thread.id);
      }
    }
  }

  return NextResponse.json({
    unreadCount: unreadThreadIds.length,
    unreadThreads: unreadThreadIds,
  });
}
