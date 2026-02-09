import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchAlert = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  make: string | null;
  model: string | null;
  year_min: number | null;
  year_max: number | null;
  price_min: number | null;
  price_max: number | null;
  location: string | null;
  transmission: string | null;
  is_active: boolean;
  email_notifications: boolean;
};

type Listing = {
  id: string;
  title: string;
  category: string;
  make: string | null;
  model: string | null;
  year: number | null;
  price_eur: number | null;
  location: string | null;
  transmission: string | null;
  owner_id: string;
};

// Check if a listing matches an alert's criteria
function listingMatchesAlert(listing: Listing, alert: SearchAlert): boolean {
  if (alert.category && listing.category !== alert.category) {
    return false;
  }
  if (alert.make && listing.make?.toLowerCase() !== alert.make.toLowerCase()) {
    return false;
  }
  if (alert.model && listing.model?.toLowerCase() !== alert.model.toLowerCase()) {
    return false;
  }
  if (alert.year_min && (listing.year === null || listing.year < alert.year_min)) {
    return false;
  }
  if (alert.year_max && (listing.year === null || listing.year > alert.year_max)) {
    return false;
  }
  if (alert.price_min && (listing.price_eur === null || listing.price_eur < alert.price_min)) {
    return false;
  }
  if (alert.price_max && (listing.price_eur === null || listing.price_eur > alert.price_max)) {
    return false;
  }
  if (alert.location && listing.location !== alert.location) {
    return false;
  }
  if (alert.transmission && listing.transmission !== alert.transmission) {
    return false;
  }
  return true;
}

// POST - Check which alerts match a listing and create notifications
// Called when a listing is approved
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only allow authenticated users (admins would call this after approval)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { listingId: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { listingId } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // Get the listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, category, make, model, year, price_eur, location, transmission, owner_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Only process active listings
  if (listing.status !== "active") {
    return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
  }

  // Get all active alerts (excluding the listing owner's alerts)
  const { data: alerts, error: alertsError } = await supabase
    .from("search_alerts")
    .select("*")
    .eq("is_active", true)
    .neq("user_id", listing.owner_id); // Don't notify the listing owner

  if (alertsError) {
    return NextResponse.json({ error: alertsError.message }, { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ matchingAlerts: 0, notificationsCreated: 0 });
  }

  // Find alerts that match this listing
  const matchingAlerts = (alerts as SearchAlert[]).filter((alert) =>
    listingMatchesAlert(listing as Listing, alert)
  );

  if (matchingAlerts.length === 0) {
    return NextResponse.json({ matchingAlerts: 0, notificationsCreated: 0 });
  }

  // Check for existing notifications to avoid duplicates
  const alertIds = matchingAlerts.map((a) => a.id);
  const { data: existingNotifications } = await supabase
    .from("alert_notifications")
    .select("alert_id")
    .eq("listing_id", listingId)
    .in("alert_id", alertIds);

  const alreadyNotifiedIds = new Set(
    (existingNotifications ?? []).map((n) => n.alert_id)
  );

  // Filter to only new notifications
  const alertsToNotify = matchingAlerts.filter(
    (alert) => !alreadyNotifiedIds.has(alert.id)
  );

  if (alertsToNotify.length === 0) {
    return NextResponse.json({
      matchingAlerts: matchingAlerts.length,
      notificationsCreated: 0,
      alreadyNotified: matchingAlerts.length,
    });
  }

  // Create notification records
  const notificationRecords = alertsToNotify.map((alert) => ({
    alert_id: alert.id,
    listing_id: listingId,
    notification_type: "in_app" as const,
  }));

  const { error: insertError } = await supabase
    .from("alert_notifications")
    .insert(notificationRecords);

  if (insertError) {
    console.error("Failed to insert notifications:", insertError);
    return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 });
  }

  return NextResponse.json({
    matchingAlerts: matchingAlerts.length,
    notificationsCreated: alertsToNotify.length,
    alreadyNotified: matchingAlerts.length - alertsToNotify.length,
  });
}
