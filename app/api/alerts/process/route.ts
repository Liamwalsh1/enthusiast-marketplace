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
  last_checked_at: string | null;
  // Extended filters
  mileage_min: number | null;
  mileage_max: number | null;
  wheel_brand: string | null;
  wheel_diameter: number | null;
  bolt_pattern: string | null;
  search_text: string | null;
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
  created_at: string;
  // Extended fields
  mileage_km: number | null;
  wheel_brand: string | null;
  wheel_diameter: number | null;
  bolt_pattern: string | null;
};

// Check if a listing matches an alert's criteria
function listingMatchesAlert(listing: Listing, alert: SearchAlert): boolean {
  // Category must match if specified
  if (alert.category && listing.category !== alert.category) {
    return false;
  }

  // Make must match if specified (case-insensitive)
  if (alert.make && listing.make?.toLowerCase() !== alert.make.toLowerCase()) {
    return false;
  }

  // Model must match if specified (case-insensitive)
  if (alert.model && listing.model?.toLowerCase() !== alert.model.toLowerCase()) {
    return false;
  }

  // Year range
  if (alert.year_min && (listing.year === null || listing.year < alert.year_min)) {
    return false;
  }
  if (alert.year_max && (listing.year === null || listing.year > alert.year_max)) {
    return false;
  }

  // Price range
  if (alert.price_min && (listing.price_eur === null || listing.price_eur < alert.price_min)) {
    return false;
  }
  if (alert.price_max && (listing.price_eur === null || listing.price_eur > alert.price_max)) {
    return false;
  }

  // Location must match if specified
  if (alert.location && listing.location !== alert.location) {
    return false;
  }

  // Transmission must match if specified
  if (alert.transmission && listing.transmission !== alert.transmission) {
    return false;
  }

  // Mileage range (for cars)
  if (alert.mileage_min && (listing.mileage_km === null || listing.mileage_km < alert.mileage_min)) {
    return false;
  }
  if (alert.mileage_max && (listing.mileage_km === null || listing.mileage_km > alert.mileage_max)) {
    return false;
  }

  // Wheel brand must match if specified (case-insensitive)
  if (alert.wheel_brand && listing.wheel_brand?.toLowerCase() !== alert.wheel_brand.toLowerCase()) {
    return false;
  }

  // Wheel diameter must match if specified
  if (alert.wheel_diameter && listing.wheel_diameter !== alert.wheel_diameter) {
    return false;
  }

  // Bolt pattern must match if specified
  if (alert.bolt_pattern && listing.bolt_pattern !== alert.bolt_pattern) {
    return false;
  }

  // Search text - check if title contains the search text (case-insensitive)
  if (alert.search_text) {
    const searchLower = alert.search_text.toLowerCase();
    const titleLower = listing.title.toLowerCase();
    const makeLower = listing.make?.toLowerCase() ?? "";
    const modelLower = listing.model?.toLowerCase() ?? "";
    const wheelBrandLower = listing.wheel_brand?.toLowerCase() ?? "";

    if (!titleLower.includes(searchLower) &&
        !makeLower.includes(searchLower) &&
        !modelLower.includes(searchLower) &&
        !wheelBrandLower.includes(searchLower)) {
      return false;
    }
  }

  return true;
}

// GET - Get matching listings for the current user's alerts
// Returns unnotified matches for each active alert
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's active alerts
  const { data: alerts, error: alertsError } = await supabase
    .from("search_alerts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (alertsError) {
    return NextResponse.json({ error: alertsError.message }, { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ matches: [], totalNewMatches: 0 });
  }

  // Get all active listings
  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, title, category, make, model, year, price_eur, location, transmission, created_at, mileage_km, wheel_brand, wheel_diameter, bolt_pattern")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (listingsError) {
    return NextResponse.json({ error: listingsError.message }, { status: 500 });
  }

  // Get existing notifications to avoid duplicates
  const alertIds = alerts.map((a) => a.id);
  const { data: existingNotifications } = await supabase
    .from("alert_notifications")
    .select("alert_id, listing_id")
    .in("alert_id", alertIds);

  const notifiedSet = new Set(
    (existingNotifications ?? []).map((n) => `${n.alert_id}:${n.listing_id}`)
  );

  // Find matches for each alert
  const matchesByAlert: {
    alertId: string;
    alertName: string;
    newMatches: Listing[];
  }[] = [];

  let totalNewMatches = 0;

  for (const alert of alerts as SearchAlert[]) {
    const newMatches: Listing[] = [];

    for (const listing of (listings ?? []) as Listing[]) {
      // Skip if already notified
      if (notifiedSet.has(`${alert.id}:${listing.id}`)) {
        continue;
      }

      // Check if listing matches alert criteria
      if (listingMatchesAlert(listing, alert)) {
        newMatches.push(listing);
      }
    }

    if (newMatches.length > 0) {
      matchesByAlert.push({
        alertId: alert.id,
        alertName: alert.name,
        newMatches,
      });
      totalNewMatches += newMatches.length;
    }
  }

  return NextResponse.json({
    matches: matchesByAlert,
    totalNewMatches,
  });
}

// POST - Mark matches as notified (creates notification records)
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    alertId: string;
    listingIds: string[];
    notificationType?: "in_app" | "email";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { alertId, listingIds, notificationType = "in_app" } = body;

  if (!alertId || !listingIds || !Array.isArray(listingIds)) {
    return NextResponse.json(
      { error: "alertId and listingIds are required" },
      { status: 400 }
    );
  }

  // Verify user owns the alert
  const { data: alert, error: alertError } = await supabase
    .from("search_alerts")
    .select("id, user_id")
    .eq("id", alertId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (alertError || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  // Insert notification records
  const notificationRecords = listingIds.map((listingId) => ({
    alert_id: alertId,
    listing_id: listingId,
    notification_type: notificationType,
  }));

  const { error: insertError } = await supabase
    .from("alert_notifications")
    .upsert(notificationRecords, { onConflict: "alert_id,listing_id" });

  if (insertError) {
    console.error("Failed to insert notifications:", insertError);
    return NextResponse.json({ error: "Failed to record notifications" }, { status: 500 });
  }

  // Update last_checked_at on the alert
  await supabase
    .from("search_alerts")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", alertId);

  return NextResponse.json({ success: true, recorded: listingIds.length });
}
