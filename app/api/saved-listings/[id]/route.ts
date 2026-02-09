import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// DELETE - Unsave a listing
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET - Check if a listing is saved
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ saved: false });
  }

  const { data: existing } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  return NextResponse.json({ saved: !!existing });
}
