import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAlertMatchEmail } from "@/app/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for processing

// This endpoint is meant to be called by a cron job (e.g., Vercel Cron)
// It processes all active alerts and sends email notifications for new matches

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
  mileage_km: number | null;
  wheel_brand: string | null;
  wheel_diameter: number | null;
  bolt_pattern: string | null;
  image_urls: string[] | null;
};

type UserProfile = {
  user_id: string;
  display_name: string | null;
  email_alerts: boolean;
};

function listingMatchesAlert(listing: Listing, alert: SearchAlert): boolean {
  if (alert.category && listing.category !== alert.category) return false;
  if (alert.make && listing.make?.toLowerCase() !== alert.make.toLowerCase()) return false;
  if (alert.model && listing.model?.toLowerCase() !== alert.model.toLowerCase()) return false;
  if (alert.year_min && (listing.year === null || listing.year < alert.year_min)) return false;
  if (alert.year_max && (listing.year === null || listing.year > alert.year_max)) return false;
  if (alert.price_min && (listing.price_eur === null || listing.price_eur < alert.price_min)) return false;
  if (alert.price_max && (listing.price_eur === null || listing.price_eur > alert.price_max)) return false;
  if (alert.location && listing.location !== alert.location) return false;
  if (alert.transmission && listing.transmission !== alert.transmission) return false;
  if (alert.mileage_min && (listing.mileage_km === null || listing.mileage_km < alert.mileage_min)) return false;
  if (alert.mileage_max && (listing.mileage_km === null || listing.mileage_km > alert.mileage_max)) return false;
  if (alert.wheel_brand && listing.wheel_brand?.toLowerCase() !== alert.wheel_brand.toLowerCase()) return false;
  if (alert.wheel_diameter && listing.wheel_diameter !== alert.wheel_diameter) return false;
  if (alert.bolt_pattern && listing.bolt_pattern !== alert.bolt_pattern) return false;

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

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client to access all data
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get all active alerts with email_notifications enabled
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from("search_alerts")
      .select("*")
      .eq("is_active", true)
      .eq("email_notifications", true);

    if (alertsError) {
      console.error("Failed to fetch alerts:", alertsError);
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: "No active alerts with email notifications", processed: 0 });
    }

    // Get unique user IDs
    const userIds = [...new Set(alerts.map((a) => a.user_id))];

    // Fetch user profiles and emails
    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select("user_id, display_name, email_alerts")
      .in("user_id", userIds);

    // Fetch user emails from auth.users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const userEmailMap = new Map(users.users.map((u) => [u.id, u.email]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p as UserProfile]));

    // Get all active listings created in the last 24 hours (for daily digest)
    // Or since last_checked_at for each alert
    const { data: recentListings, error: listingsError } = await supabaseAdmin
      .from("listings")
      .select("id, title, category, make, model, year, price_eur, location, transmission, created_at, mileage_km, wheel_brand, wheel_diameter, bolt_pattern, image_urls")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (listingsError) {
      console.error("Failed to fetch listings:", listingsError);
      return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }

    // Get existing notifications to avoid duplicates
    const alertIds = alerts.map((a) => a.id);
    const { data: existingNotifications } = await supabaseAdmin
      .from("alert_notifications")
      .select("alert_id, listing_id")
      .in("alert_id", alertIds);

    const notifiedSet = new Set(
      (existingNotifications ?? []).map((n) => `${n.alert_id}:${n.listing_id}`)
    );

    let emailsSent = 0;
    let alertsProcessed = 0;

    // Process each alert
    for (const alert of alerts as SearchAlert[]) {
      const userProfile = profileMap.get(alert.user_id);
      const userEmail = userEmailMap.get(alert.user_id);

      // Skip if user has email_alerts disabled in their profile
      if (userProfile?.email_alerts === false) {
        continue;
      }

      if (!userEmail) {
        console.warn(`No email found for user ${alert.user_id}`);
        continue;
      }

      // Find new matches for this alert
      const newMatches: Listing[] = [];

      for (const listing of (recentListings ?? []) as Listing[]) {
        // Skip if already notified
        if (notifiedSet.has(`${alert.id}:${listing.id}`)) {
          continue;
        }

        // Only consider listings created after last check (if applicable)
        if (alert.last_checked_at) {
          const lastChecked = new Date(alert.last_checked_at);
          const listingCreated = new Date(listing.created_at);
          if (listingCreated <= lastChecked) {
            continue;
          }
        }

        if (listingMatchesAlert(listing, alert)) {
          newMatches.push(listing);
        }
      }

      if (newMatches.length > 0) {
        // Send email notification
        const result = await sendAlertMatchEmail({
          toEmail: userEmail,
          toName: userProfile?.display_name || userEmail.split("@")[0],
          alertName: alert.name,
          listings: newMatches.slice(0, 5).map((l) => ({
            id: l.id,
            title: l.title,
            price_eur: l.price_eur,
            location: l.location,
            image_url: l.image_urls?.[0] ?? null,
          })),
          alertId: alert.id,
        });

        if (result.success) {
          emailsSent++;

          // Record notifications to prevent re-sending
          const notificationRecords = newMatches.map((listing) => ({
            alert_id: alert.id,
            listing_id: listing.id,
            notification_type: "email",
          }));

          await supabaseAdmin
            .from("alert_notifications")
            .upsert(notificationRecords, { onConflict: "alert_id,listing_id" });
        }

        // Update last_checked_at
        await supabaseAdmin
          .from("search_alerts")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", alert.id);

        alertsProcessed++;
      }
    }

    return NextResponse.json({
      success: true,
      alertsProcessed,
      emailsSent,
      totalAlerts: alerts.length,
    });
  } catch (err) {
    console.error("Alert email processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
