import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { sendAdminNewListingEmail } from "@/app/lib/email";

type NotifyPayload = {
  listingId: string;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: NotifyPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listingId } = payload;
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // Fetch the listing to verify ownership and get details
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, image_urls, owner_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Verify the user owns this listing
  if (listing.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only notify for pending listings
  if (listing.status !== "pending") {
    return NextResponse.json({ error: "Listing is not pending" }, { status: 400 });
  }

  // Get seller profile for name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const sellerName = profile?.display_name || user.email?.split("@")[0] || "Unknown";
  const sellerEmail = user.email || "Unknown";

  // Send admin notification (non-blocking)
  sendAdminNewListingEmail({
    listingId: listing.id,
    listingTitle: listing.title,
    category: listing.category,
    sellerEmail,
    sellerName,
    price: listing.price_eur,
    imageUrl: listing.image_urls?.[0] || null,
  }).catch((err) => {
    console.error("Failed to send admin notification:", err);
  });

  return NextResponse.json({ success: true });
}
