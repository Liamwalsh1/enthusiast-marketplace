import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let payload: { reason?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reason = payload.reason?.trim();
  if (!reason) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (listing.owner_id === user.id) {
    return NextResponse.json({ error: "You cannot report your own listing." }, { status: 400 });
  }

  const { data: report, error: insertError } = await supabase
    .from("listing_reports")
    .insert({ listing_id: listingId, reported_by: user.id, reason: reason.slice(0, 500) })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You have already reported this listing." }, { status: 400 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ report }, { status: 201 });
}
