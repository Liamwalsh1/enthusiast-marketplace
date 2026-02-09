import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import AdminListingsTable from "@/app/components/AdminListingsTable";
import AdminListingsFilter from "@/app/components/AdminListingsFilter";

type ListingRow = {
  id: string;
  title: string;
  category: string;
  price_eur: number | null;
  location: string | null;
  status: string;
  created_at: string;
  owner_id: string;
  is_featured: boolean;
};

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const categoryFilter = params.category || "all";
  const searchQuery = params.q || "";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/listings");
  }

  // Check if user is admin
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    redirect("/");
  }

  // Build query
  let query = supabase
    .from("listings")
    .select("id, title, category, price_eur, location, status, created_at, owner_id, is_featured")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (categoryFilter !== "all") {
    query = query.eq("category", categoryFilter);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data: listings, error } = await query.limit(100);

  if (error) {
    console.error("Failed to fetch listings:", error);
  }

  const listingList = (listings ?? []) as ListingRow[];

  // Fetch owner profiles
  const ownerIds = [...new Set(listingList.map((l) => l.owner_id))];
  const { data: profiles } = ownerIds.length > 0
    ? await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", ownerIds)
    : { data: [] };

  const profileMap = new Map<string, string>();
  (profiles ?? []).forEach((p) => {
    if (p.display_name) profileMap.set(p.user_id, p.display_name);
  });

  // Get counts for each status
  const [activeCount, pendingCount, soldCount, rejectedCount] = await Promise.all([
    supabase.from("listings").select("id", { head: true, count: "exact" }).eq("status", "active"),
    supabase.from("listings").select("id", { head: true, count: "exact" }).eq("status", "pending"),
    supabase.from("listings").select("id", { head: true, count: "exact" }).eq("status", "sold"),
    supabase.from("listings").select("id", { head: true, count: "exact" }).eq("status", "rejected"),
  ]);

  const counts = {
    all: (activeCount.count ?? 0) + (pendingCount.count ?? 0) + (soldCount.count ?? 0) + (rejectedCount.count ?? 0),
    active: activeCount.count ?? 0,
    pending: pendingCount.count ?? 0,
    sold: soldCount.count ?? 0,
    rejected: rejectedCount.count ?? 0,
  };

  return (
    <main className="container">
      <Link className="pill" href="/admin">← Back to dashboard</Link>

      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0" }}>
        All Listings
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <CountCard label="All" count={counts.all} active={statusFilter === "all"} href="/admin/listings" />
        <CountCard label="Pending" count={counts.pending} active={statusFilter === "pending"} href="/admin/listings?status=pending" highlight={counts.pending > 0 ? "warning" : undefined} />
        <CountCard label="Active" count={counts.active} active={statusFilter === "active"} href="/admin/listings?status=active" />
        <CountCard label="Sold" count={counts.sold} active={statusFilter === "sold"} href="/admin/listings?status=sold" />
        <CountCard label="Rejected" count={counts.rejected} active={statusFilter === "rejected"} href="/admin/listings?status=rejected" highlight={counts.rejected > 0 ? "error" : undefined} />
      </div>

      <AdminListingsFilter
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
      />

      {listingList.length === 0 ? (
        <section className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>No listings found</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            Try adjusting your filters or search query.
          </p>
        </section>
      ) : (
        <AdminListingsTable listings={listingList} profileMap={profileMap} />
      )}
    </main>
  );
}

function CountCard({
  label,
  count,
  active,
  href,
  highlight,
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
  highlight?: "warning" | "error";
}) {
  let borderColor = active ? "var(--green-900)" : "var(--border)";
  let bgColor = active ? "var(--soft)" : "white";
  let textColor = "var(--green-900)";

  if (highlight === "warning") {
    borderColor = active ? "rgba(234,179,8,0.6)" : "rgba(234,179,8,0.3)";
    bgColor = active ? "rgba(234,179,8,0.15)" : "rgba(234,179,8,0.05)";
    textColor = "rgba(161,98,7,1)";
  } else if (highlight === "error") {
    borderColor = active ? "rgba(220,38,38,0.6)" : "rgba(220,38,38,0.3)";
    bgColor = active ? "rgba(220,38,38,0.15)" : "rgba(220,38,38,0.05)";
    textColor = "rgba(153,27,27,1)";
  }

  return (
    <Link
      href={href}
      className="card"
      style={{
        padding: 12,
        textAlign: "center",
        textDecoration: "none",
        border: `2px solid ${borderColor}`,
        background: bgColor,
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 900, color: textColor }}>{count}</div>
      <div style={{ color: "var(--muted)", fontWeight: 650, fontSize: 12 }}>{label}</div>
    </Link>
  );
}
