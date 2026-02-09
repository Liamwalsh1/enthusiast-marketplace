import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// POST - Create a new review
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    seller_id?: string;
    listing_id?: string;
    rating?: number;
    title?: string;
    body?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sellerId = body.seller_id?.trim();
  const listingId = body.listing_id?.trim() || null;
  const rating = body.rating;
  const title = body.title?.trim().slice(0, 100) || null;
  const reviewBody = body.body?.trim().slice(0, 1000) || null;

  if (!sellerId) {
    return NextResponse.json({ error: "seller_id is required" }, { status: 400 });
  }

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  // Prevent self-review
  if (sellerId === user.id) {
    return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
  }

  // Check if seller exists
  const { data: seller } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", sellerId)
    .maybeSingle();

  // If no profile, check if the user exists via a listing they own
  if (!seller) {
    const { data: listing } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("owner_id", sellerId)
      .limit(1)
      .maybeSingle();

    if (!listing) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }
  }

  // Check for existing review
  const { data: existingReview } = await supabase
    .from("seller_reviews")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("reviewer_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existingReview) {
    return NextResponse.json(
      { error: "You have already reviewed this seller for this listing" },
      { status: 409 }
    );
  }

  const { data: review, error } = await supabase
    .from("seller_reviews")
    .insert({
      seller_id: sellerId,
      reviewer_id: user.id,
      listing_id: listingId,
      rating,
      title,
      body: reviewBody,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
