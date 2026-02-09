import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(
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

  // Check if user is admin
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update listing to active
  const { error } = await supabase
    .from("listings")
    .update({
      status: "active",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check alerts and create notifications for matching users
  // This is done asynchronously - we don't wait for it
  processAlertNotifications(id, supabase).catch((err) => {
    console.error("Failed to process alert notifications:", err);
  });

  return NextResponse.json({ success: true });
}

// Process alert notifications for a newly approved listing
async function processAlertNotifications(
  listingId: string,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  // Get the listing details
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, category, make, model, year, price_eur, location, transmission, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return;

  // Get all active alerts (excluding the listing owner's alerts)
  const { data: alerts } = await supabase
    .from("search_alerts")
    .select("id, user_id, category, make, model, year_min, year_max, price_min, price_max, location, transmission")
    .eq("is_active", true)
    .neq("user_id", listing.owner_id);

  if (!alerts || alerts.length === 0) return;

  // Find matching alerts
  const matchingAlertIds: string[] = [];

  for (const alert of alerts) {
    let matches = true;

    if (alert.category && listing.category !== alert.category) matches = false;
    if (alert.make && listing.make?.toLowerCase() !== alert.make.toLowerCase()) matches = false;
    if (alert.model && listing.model?.toLowerCase() !== alert.model.toLowerCase()) matches = false;
    if (alert.year_min && (listing.year === null || listing.year < alert.year_min)) matches = false;
    if (alert.year_max && (listing.year === null || listing.year > alert.year_max)) matches = false;
    if (alert.price_min && (listing.price_eur === null || listing.price_eur < alert.price_min)) matches = false;
    if (alert.price_max && (listing.price_eur === null || listing.price_eur > alert.price_max)) matches = false;
    if (alert.location && listing.location !== alert.location) matches = false;
    if (alert.transmission && listing.transmission !== alert.transmission) matches = false;

    if (matches) {
      matchingAlertIds.push(alert.id);
    }
  }

  if (matchingAlertIds.length === 0) return;

  // Create notification records
  const notifications = matchingAlertIds.map((alertId) => ({
    alert_id: alertId,
    listing_id: listingId,
    notification_type: "in_app",
  }));

  await supabase
    .from("alert_notifications")
    .upsert(notifications, { onConflict: "alert_id,listing_id" });
}
