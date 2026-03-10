import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { sendNewMessageEmail } from "@/app/lib/email";

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
    .select("id, listing_id, buyer_id, seller_id")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const isParticipant = thread.buyer_id === user.id || thread.seller_id === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "You are not part of this conversation." }, { status: 403 });
  }

  if (thread.listing_id) {
    const { data: listing } = await supabase
      .from("listings")
      .select("status")
      .eq("id", thread.listing_id)
      .maybeSingle();

    if (listing?.status === "sold") {
      return NextResponse.json(
        { error: "This listing has been marked as sold. Messaging is disabled." },
        { status: 400 }
      );
    }
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

  // Send email notification to the recipient (non-blocking)
  const recipientId = thread.buyer_id === user.id ? thread.seller_id : thread.buyer_id;

  // Fetch recipient info, sender info, and listing title
  const [recipientResult, senderResult, listingResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, email_messages")
      .eq("user_id", recipientId)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    thread.listing_id
      ? supabase.from("listings").select("title").eq("id", thread.listing_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Get recipient email from auth.users via RPC or service role
  // For now, we'll use the Supabase admin client approach
  const recipientProfile = recipientResult.data;
  const senderProfile = senderResult.data;
  const listing = listingResult.data;

  // Only send if recipient has email_messages enabled (default true)
  if (recipientProfile?.email_messages !== false) {
    // We need to get the recipient's email - fetch via admin or use a function
    // For security, we'll create a server-side function to get the email
    const { data: recipientAuth } = await supabase.rpc("get_user_email", { p_user_id: recipientId });

    if (recipientAuth) {
      // Send email asynchronously (don't wait for it)
      sendNewMessageEmail({
        toEmail: recipientAuth,
        toName: recipientProfile?.display_name || recipientAuth.split("@")[0],
        senderName: senderProfile?.display_name || user.email?.split("@")[0] || "Someone",
        listingTitle: listing?.title || "a listing",
        messagePreview: trimmedBody,
        threadId,
      }).catch((err) => {
        console.error("Failed to send message notification email:", err);
      });
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
