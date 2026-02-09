import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import AdminListingCard from "@/app/components/AdminListingCard";

type ListingRow = {
  id: string;
  title: string;
  category: string;
  price_eur: number | null;
  location: string | null;
  created_at: string;
  image_urls: string[] | null;
  owner_id: string;
};

export default async function AdminPendingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/pending");
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

  // Fetch pending listings
  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, location, created_at, image_urls, owner_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (listingsError) {
    console.error("Failed to fetch pending listings:", listingsError);
  }

  const pendingListings = (listings ?? []) as ListingRow[];

  // Fetch user profiles for all owners
  const ownerIds = [...new Set(pendingListings.map((l) => l.owner_id))];
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

  return (
    <main className="container">
      <Link className="pill" href="/admin">← Back to dashboard</Link>

      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0" }}>
        Pending Listings
      </h1>

      {pendingListings.length === 0 ? (
        <section className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>All caught up!</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            No listings pending review.
          </p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {pendingListings.map((listing) => {
            const ownerName = profileMap.get(listing.owner_id) ?? "Unknown seller";
            return (
              <AdminListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  category: listing.category,
                  price_eur: listing.price_eur,
                  location: listing.location,
                  created_at: listing.created_at,
                  image_url: listing.image_urls?.[0] ?? null,
                  owner_name: ownerName,
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
