import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

type CommentPayload = {
  listingId?: string;
  parentId?: string | null;
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

  let payload: CommentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const listingId = payload.listingId?.trim();
  const parentId = payload.parentId?.trim() || null;
  const body = payload.body?.trim();

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Comment body cannot be empty." }, { status: 400 });
  }

  // Verify listing exists
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  // If replying, verify parent comment exists and belongs to same listing
  if (parentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from("comments")
      .select("id, listing_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parentComment) {
      return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
    }

    if (parentComment.listing_id !== listingId) {
      return NextResponse.json({ error: "Parent comment belongs to different listing." }, { status: 400 });
    }
  }

  const trimmedBody = body.slice(0, 2000);

  const { data: comment, error: insertError } = await supabase
    .from("comments")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      parent_id: parentId,
      body: trimmedBody,
    })
    .select("id, listing_id, user_id, parent_id, body, is_deleted, created_at, updated_at")
    .single();

  if (insertError || !comment) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to post comment." },
      { status: 400 }
    );
  }

  return NextResponse.json({ comment }, { status: 201 });
}
