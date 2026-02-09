import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// DELETE - Delete a review
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("seller_reviews")
    .delete()
    .eq("id", id)
    .eq("reviewer_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH - Update a review
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    rating?: number;
    title?: string;
    body?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.rating !== undefined) {
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    updates.rating = body.rating;
  }
  if (body.title !== undefined) {
    updates.title = body.title?.trim().slice(0, 100) || null;
  }
  if (body.body !== undefined) {
    updates.body = body.body?.trim().slice(0, 1000) || null;
  }

  const { data: review, error } = await supabase
    .from("seller_reviews")
    .update(updates)
    .eq("id", id)
    .eq("reviewer_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ review });
}
