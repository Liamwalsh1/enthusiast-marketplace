import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// GET - List all saved listings for current user
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: savedListings, error } = await supabase
    .from("saved_listings")
    .select(`
      id,
      created_at,
      listing:listings (
        id,
        title,
        category,
        price_eur,
        location,
        condition,
        status,
        make,
        model,
        year,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ savedListings });
}

// POST - Save a listing
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { listing_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = body.listing_id?.trim();

  if (!listingId) {
    return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
  }

  // Check if listing exists
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Listing already saved" }, { status: 409 });
  }

  const { data: saved, error } = await supabase
    .from("saved_listings")
    .insert({
      user_id: user.id,
      listing_id: listingId,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved }, { status: 201 });
}
