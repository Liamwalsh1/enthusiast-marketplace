// Ensure DB has sold_at column:
// ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS sold_at timestamptz;
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import SellerListingsTabs from "./seller-listings-tabs";

type ListingRow = {
  id: string;
  title: string | null;
  price: number | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
  sold_at: string | null;
};

export const dynamic = "force-dynamic";

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams?: { status?: string | string[] };
}) {
  const statusParam = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  const activeTab: "active" | "sold" = statusParam === "sold" ? "sold" : "active";

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

  const [activeCountRes, soldCountRes, totalCountRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "sold"),
    supabase.from("listings").select("id", { head: true, count: "exact" }).eq("user_id", user.id),
  ]);

  const activeCount = activeCountRes.count ?? 0;
  const soldCount = soldCountRes.count ?? 0;
  const totalCount = totalCountRes.count ?? 0;

  const {
    data: listingRows,
    error: listingsError,
  } = await supabase
    .from("listings")
    .select("id,title,price,status,updated_at,created_at,sold_at")
    .eq("user_id", user.id)
    .eq("status", activeTab)
    .order("updated_at", { ascending: false });

  if (listingsError) {
    console.error("Failed to load seller listings:", listingsError);
  }

  const listings = (listingRows ?? []) as ListingRow[];

  return (
    <main className="container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[color:var(--green-900)]">Your listings</h1>
          <p className="mt-1 text-[color:var(--muted)] font-semibold">{user.email ?? user.id}</p>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Create listing
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Active" value={activeCount} />
        <StatsCard label="Sold" value={soldCount} />
        <StatsCard label="Total" value={totalCount} />
      </div>

      <SellerListingsTabs
        activeTab={activeTab}
        listings={listings}
        counts={{ active: activeCount, sold: soldCount, total: totalCount }}
      />
    </main>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card rounded-2xl border border-[color:var(--border)] bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-[color:var(--muted)]">{label}</div>
      <div className="text-3xl font-black text-[color:var(--green-900)]">{value}</div>
    </div>
  );
}
