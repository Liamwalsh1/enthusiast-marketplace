import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get all alert matches (notifications) for the current user
// Returns listings that match user's alerts, grouped by alert
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for ?unread=true query param
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  // Get user's alerts
  const { data: alerts, error: alertsError } = await supabase
    .from("search_alerts")
    .select("id, name, is_active")
    .eq("user_id", user.id);

  if (alertsError) {
    return NextResponse.json({ error: alertsError.message }, { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ matches: [], totalCount: 0, unreadCount: 0 });
  }

  const alertIds = alerts.map((a) => a.id);
  const alertMap = new Map(alerts.map((a) => [a.id, a]));

  // Get notifications for user's alerts
  let notificationsQuery = supabase
    .from("alert_notifications")
    .select(`
      id,
      alert_id,
      listing_id,
      notified_at,
      notification_type,
      listings (
        id,
        title,
        category,
        price_eur,
        location,
        make,
        model,
        year,
        status,
        image_urls
      )
    `)
    .in("alert_id", alertIds)
    .order("notified_at", { ascending: false });

  const { data: notifications, error: notificationsError } = await notificationsQuery;

  if (notificationsError) {
    return NextResponse.json({ error: notificationsError.message }, { status: 500 });
  }

  // Get user's last viewed timestamp for alerts (stored in user profile or separate tracking)
  // For now, we'll consider notifications from the last 7 days as "new"
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Group notifications by alert
  type Match = {
    notificationId: string;
    listing: {
      id: string;
      title: string;
      category: string;
      price_eur: number | null;
      location: string | null;
      make: string | null;
      model: string | null;
      year: number | null;
      status: string | null;
      image_urls: string[] | null;
    };
    notifiedAt: string;
    isNew: boolean;
  };

  const matchesByAlert: {
    alertId: string;
    alertName: string;
    isActive: boolean;
    matches: Match[];
    newCount: number;
  }[] = [];

  let totalCount = 0;
  let unreadCount = 0;

  // Group by alert
  const alertGroups = new Map<string, Match[]>();

  for (const notification of notifications ?? []) {
    const listingData = notification.listings as unknown as Match["listing"] | Match["listing"][] | null;
    // Skip if listing was deleted or is not active anymore
    if (!listingData) continue;
    const listing = Array.isArray(listingData) ? listingData[0] : listingData;
    if (!listing || listing.status !== "active") {
      continue;
    }
    const isNew = new Date(notification.notified_at) > sevenDaysAgo;

    const match: Match = {
      notificationId: notification.id,
      listing,
      notifiedAt: notification.notified_at,
      isNew,
    };

    if (!alertGroups.has(notification.alert_id)) {
      alertGroups.set(notification.alert_id, []);
    }
    alertGroups.get(notification.alert_id)!.push(match);

    totalCount++;
    if (isNew) unreadCount++;
  }

  // Build response
  for (const [alertId, matches] of alertGroups) {
    const alert = alertMap.get(alertId);
    if (!alert) continue;

    const newCount = matches.filter((m) => m.isNew).length;

    // If unreadOnly filter is set, skip alerts with no new matches
    if (unreadOnly && newCount === 0) continue;

    matchesByAlert.push({
      alertId,
      alertName: alert.name,
      isActive: alert.is_active,
      matches: unreadOnly ? matches.filter((m) => m.isNew) : matches,
      newCount,
    });
  }

  // Sort by most recent notification
  matchesByAlert.sort((a, b) => {
    const aTime = a.matches[0]?.notifiedAt ?? "";
    const bTime = b.matches[0]?.notifiedAt ?? "";
    return bTime.localeCompare(aTime);
  });

  return NextResponse.json({
    matches: matchesByAlert,
    totalCount,
    unreadCount,
  });
}
