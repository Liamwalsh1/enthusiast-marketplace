import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { sendNewMessageEmail } from "@/app/lib/email";

type ThreadPayload = {
  listingId?: string;
  message?: string;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let payload: ThreadPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const listingId = payload.listingId?.trim();
  const message = payload.message?.trim() ?? "";

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id, status")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (!listing.owner_id) {
    return NextResponse.json({ error: "Listing is missing an owner." }, { status: 400 });
  }

  if (listing.status === "sold") {
    return NextResponse.json({ error: "This listing has been marked as sold. Messaging is disabled." }, { status: 400 });
  }

  if (listing.owner_id === user.id) {
    return NextResponse.json({ error: "You cannot message your own listing." }, { status: 400 });
  }

  const { data: existingThread, error: existingError } = await supabase
    .from("threads")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  let threadId = existingThread?.id ?? null;
  const now = new Date().toISOString();

  if (!threadId) {
    const { data: newThread, error: newThreadError } = await supabase
      .from("threads")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.owner_id,
        last_message_at: now,
      })
      .select("id")
      .single();

    if (newThreadError || !newThread) {
      return NextResponse.json({ error: newThreadError?.message ?? "Failed to create thread." }, { status: 400 });
    }

    threadId = newThread.id;
  }

  const messageBody = message.slice(0, 2000);

  const { error: messageError } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body: messageBody,
  });

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 400 });
  }

  await supabase.from("threads").update({ last_message_at: now }).eq("id", threadId);

  // Send email notification to seller for new threads (non-blocking)
  if (!existingThread) {
    const [recipientResult, senderResult, listingResult] = await Promise.all([
      supabase.from("user_profiles").select("display_name, email_messages").eq("user_id", listing.owner_id).maybeSingle(),
      supabase.from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("listings").select("title").eq("id", listingId).maybeSingle(),
    ]);

    const recipientProfile = recipientResult.data;
    const senderProfile = senderResult.data;
    const listingData = listingResult.data;

    if (recipientProfile?.email_messages !== false) {
      const { data: recipientEmail } = await supabase.rpc("get_user_email", { p_user_id: listing.owner_id });

      if (recipientEmail) {
        sendNewMessageEmail({
          toEmail: recipientEmail,
          toName: recipientProfile?.display_name || recipientEmail.split("@")[0],
          senderName: senderProfile?.display_name || user.email?.split("@")[0] || "Someone",
          listingTitle: listingData?.title || "a listing",
          messagePreview: messageBody,
          threadId,
        }).catch((err) => {
          console.error("Failed to send new thread email notification:", err);
        });
      }
    }
  }

  return NextResponse.json({ threadId }, { status: existingThread ? 200 : 201 });
}
