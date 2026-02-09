import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import AlertsList from "./AlertsList";
import CreateAlertForm from "./CreateAlertForm";

export const dynamic = "force-dynamic";

export type SearchAlert = {
  id: string;
  name: string;
  category: "car" | "part" | "memorabilia" | null;
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
  created_at: string;
  updated_at: string;
};

export type AlertMatchCount = {
  alertId: string;
  newCount: number;
  totalCount: number;
};

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/alerts");
  }

  const { data: alerts, error } = await supabase
    .from("search_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (alerts ?? []) as SearchAlert[];

  // Fetch notification counts for each alert
  const matchCounts: AlertMatchCount[] = [];

  if (items.length > 0) {
    const alertIds = items.map((a) => a.id);

    // Get all notifications for user's alerts
    const { data: notifications } = await supabase
      .from("alert_notifications")
      .select(`
        alert_id,
        notified_at,
        listings!inner (
          id,
          status
        )
      `)
      .in("alert_id", alertIds);

    // Calculate "new" threshold (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Group counts by alert
    const countMap = new Map<string, { newCount: number; totalCount: number }>();

    for (const notification of notifications ?? []) {
      const listing = notification.listings as unknown as { id: string; status: string } | null;
      // Only count active listings
      if (!listing || listing.status !== "active") continue;

      if (!countMap.has(notification.alert_id)) {
        countMap.set(notification.alert_id, { newCount: 0, totalCount: 0 });
      }

      const counts = countMap.get(notification.alert_id)!;
      counts.totalCount++;

      if (new Date(notification.notified_at) > sevenDaysAgo) {
        counts.newCount++;
      }
    }

    // Build the match counts array
    for (const alertId of alertIds) {
      const counts = countMap.get(alertId) ?? { newCount: 0, totalCount: 0 };
      matchCounts.push({ alertId, ...counts });
    }
  }

  return (
    <main className="container" style={{ display: "grid", gap: 16 }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Search Alerts</h1>
          <p style={styles.p}>
            Get notified when new listings match your saved searches
          </p>
        </div>
        <Link className="btn btn-secondary" href="/account">
          Back to Account
        </Link>
      </div>

      {error ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
            Unable to load alerts
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>
            {error.message}
          </div>
        </section>
      ) : (
        <>
          <section className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 950, color: "var(--green-900)", marginBottom: 12 }}>
              Create New Alert
            </div>
            <CreateAlertForm />
          </section>

          <section className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 950, color: "var(--green-900)", marginBottom: 12 }}>
              Your Alerts ({items.length})
            </div>
            {items.length === 0 ? (
              <div style={{ color: "var(--muted)", fontWeight: 650 }}>
                No alerts yet. Create one above to get notified about new listings.
              </div>
            ) : (
              <AlertsList alerts={items} matchCounts={matchCounts} />
            )}
          </section>
        </>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
  },
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
};
