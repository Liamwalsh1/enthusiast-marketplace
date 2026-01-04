import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

type MessagePayload = {
  threadId?: string;
  body?: string;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let payload: MessagePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const threadId = payload.threadId?.trim();
  const messageBody = payload.body?.trim();

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required." }, { status: 400 });
  }

  if (!messageBody) {
    return NextResponse.json({ error: "Message body cannot be empty." }, { status: 400 });
  }

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id, buyer_id, seller_id")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const isParticipant = thread.buyer_id === user.id || thread.seller_id === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "You are not part of this conversation." }, { status: 403 });
  }

  const trimmedBody = messageBody.slice(0, 2000);

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: trimmedBody,
    })
    .select("id, thread_id, sender_id, body, created_at")
    .single();

  if (insertError || !message) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to send message." },
      { status: 400 }
    );
  }

  await supabase.from("threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);

  return NextResponse.json({ message }, { status: 201 });
}
