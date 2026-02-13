import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import SellerListingsTabs from "./seller-listings-tabs";

type ListingRow = {
  id: string;
  title: string | null;
  price_eur: number | null;
  status: string | null;
  created_at: string | null;
  sold_at: string | null;
  rejection_reason: string | null;
  view_count: number | null;
  save_count: number | null;
  inquiry_count: number | null;
  boosted_until: string | null;
  featured_until: string | null;
};

export const dynamic = "force-dynamic";

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string | string[] }>;
}) {
  const resolvedParams = await searchParams;
  const statusParam = Array.isArray(resolvedParams?.status) ? resolvedParams?.status[0] : resolvedParams?.status;
  const validTabs = ["active", "sold", "pending", "rejected"] as const;
  type TabType = typeof validTabs[number];
  const activeTab: TabType = validTabs.includes(statusParam as TabType) ? (statusParam as TabType) : "active";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV !== "production") {
    console.debug("Seller listings user check:", { hasUser: !!user, error: userError?.message ?? null });
  }

  if (!user) {
    redirect("/signin?next=/account/listings");
  }

  const [activeCountRes, soldCountRes, pendingCountRes, rejectedCountRes, totalCountRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("owner_id", user.id)
      .eq("status", "active"),
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("owner_id", user.id)
      .eq("status", "sold"),
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("owner_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("owner_id", user.id)
      .eq("status", "rejected"),
    supabase.from("listings").select("id", { head: true, count: "exact" }).eq("owner_id", user.id),
  ]);

  [activeCountRes.error, soldCountRes.error, pendingCountRes.error, rejectedCountRes.error, totalCountRes.error].forEach((err, idx) => {
    if (err) {
      const names = ["active", "sold", "pending", "rejected", "total"];
      console.error("Failed to load listings count:", {
        which: names[idx],
        message: err.message,
        details: (err as { details?: string }).details,
        hint: (err as { hint?: string }).hint,
        code: (err as { code?: string }).code,
      });
    }
  });

  const activeCount = activeCountRes.count ?? 0;
  const soldCount = soldCountRes.count ?? 0;
  const pendingCount = pendingCountRes.count ?? 0;
  const rejectedCount = rejectedCountRes.count ?? 0;
  const totalCount = totalCountRes.count ?? 0;

  const {
    data: listingRows,
    error: listingsError,
  } = await supabase
    .from("listings")
    .select("id,title,price_eur,status,created_at,sold_at,rejection_reason,view_count,save_count,inquiry_count,boosted_until,featured_until")
    .eq("owner_id", user.id)
    .eq("status", activeTab)
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("Failed to load seller listings:", {
      message: listingsError.message,
      details: (listingsError as { details?: string }).details,
      hint: (listingsError as { hint?: string }).hint,
      code: (listingsError as { code?: string }).code,
    });
  }

  const listings = (listingRows ?? []) as ListingRow[];
  const listingsErrorDetails = listingsError
    ? {
        message: listingsError.message,
        details: (listingsError as { details?: string }).details,
        hint: (listingsError as { hint?: string }).hint,
        code: (listingsError as { code?: string }).code,
      }
    : null;

  // Calculate totals for analytics summary
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count ?? 0), 0);
  const totalSaves = listings.reduce((sum, l) => sum + (l.save_count ?? 0), 0);
  const totalInquiries = listings.reduce((sum, l) => sum + (l.inquiry_count ?? 0), 0);

  return (
    <main className="container">
      <div className="card" style={styles.header}>
        <div>
          <h1 className="page-title">Your Listings</h1>
          <p style={styles.subtitle}>{user.email ?? user.id}</p>
          <p style={styles.description}>Manage your active and sold listings.</p>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Create listing
        </Link>
      </div>

      <div style={styles.statsGrid}>
        <StatsCard label="Pending" value={pendingCount} highlight={pendingCount > 0 ? "warning" : undefined} />
        <StatsCard label="Active" value={activeCount} />
        <StatsCard label="Sold" value={soldCount} />
        <StatsCard label="Rejected" value={rejectedCount} highlight={rejectedCount > 0 ? "error" : undefined} />
        <StatsCard label="Total" value={totalCount} />
      </div>

      {activeTab === "active" && (totalViews > 0 || totalSaves > 0 || totalInquiries > 0) && (
        <div className="card" style={styles.analyticsCard}>
          <div style={styles.analyticsTitle}>Performance Overview</div>
          <div style={styles.analyticsGrid}>
            <div style={styles.analyticItem}>
              <div style={styles.analyticValue}>{totalViews}</div>
              <div style={styles.analyticLabel}>Total Views</div>
            </div>
            <div style={styles.analyticItem}>
              <div style={styles.analyticValue}>{totalSaves}</div>
              <div style={styles.analyticLabel}>Total Saves</div>
            </div>
            <div style={styles.analyticItem}>
              <div style={styles.analyticValue}>{totalInquiries}</div>
              <div style={styles.analyticLabel}>Inquiries</div>
            </div>
          </div>
        </div>
      )}

      {listingsErrorDetails ? (
        <div className="card" style={styles.errorCard}>
          <div style={styles.errorTitle}>Couldn&apos;t load your listings</div>
          <div>{listingsErrorDetails.message}</div>
          {listingsErrorDetails.code || listingsErrorDetails.details || listingsErrorDetails.hint ? (
            <div style={styles.errorDetails}>
              {listingsErrorDetails.code ? <div>Code: {listingsErrorDetails.code}</div> : null}
              {listingsErrorDetails.details ? <div>Details: {listingsErrorDetails.details}</div> : null}
              {listingsErrorDetails.hint ? <div>Hint: {listingsErrorDetails.hint}</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <SellerListingsTabs
        activeTab={activeTab}
        listings={listings}
        counts={{ active: activeCount, sold: soldCount, pending: pendingCount, rejected: rejectedCount, total: totalCount }}
      />
    </main>
  );
}

function StatsCard({ label, value, highlight }: { label: string; value: number; highlight?: "warning" | "error" }) {
  const cardStyle: CSSProperties = {
    ...styles.statsCard,
    ...(highlight === "warning" ? styles.statsCardWarning : {}),
    ...(highlight === "error" ? styles.statsCardError : {}),
  };
  const valueStyle: CSSProperties = {
    ...styles.statsValue,
    ...(highlight === "warning" ? { color: "rgb(180, 83, 9)" } : {}),
    ...(highlight === "error" ? { color: "rgb(185, 28, 28)" } : {}),
  };

  return (
    <div className="card" style={cardStyle}>
      <div style={styles.statsLabel}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    padding: 24,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 650,
    color: "var(--muted)",
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    color: "var(--muted)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    marginTop: 16,
  },
  statsCard: {
    padding: 16,
  },
  statsCardWarning: {
    background: "rgba(251, 191, 36, 0.1)",
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  statsCardError: {
    background: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: 650,
    color: "var(--muted)",
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 950,
    color: "var(--green-900)",
  },
  analyticsCard: {
    padding: 20,
    marginTop: 16,
    background: "rgba(11, 47, 26, 0.03)",
  },
  analyticsTitle: {
    fontWeight: 900,
    color: "var(--green-900)",
    marginBottom: 16,
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  analyticItem: {
    textAlign: "center",
    padding: 16,
    background: "white",
    borderRadius: 12,
    border: "1px solid var(--border)",
  },
  analyticValue: {
    fontSize: 28,
    fontWeight: 950,
    color: "var(--green-900)",
  },
  analyticLabel: {
    fontSize: 13,
    fontWeight: 650,
    color: "var(--muted)",
    marginTop: 4,
  },
  errorCard: {
    padding: 16,
    marginTop: 16,
    background: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    fontSize: 14,
    color: "rgb(153, 27, 27)",
  },
  errorTitle: {
    fontWeight: 900,
    color: "rgb(127, 29, 29)",
    marginBottom: 8,
  },
  errorDetails: {
    marginTop: 8,
    fontSize: 12,
    color: "rgb(185, 28, 28)",
  },
};
