import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

type Listing = {
  id: string;
  title: string;
  price_eur: number | null;
  created_at: string;
  image_urls: string[] | null;
};

export const dynamic = "force-dynamic";

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

export default async function AccountListingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV !== "production") {
    console.debug("Account listings user check:", { hasUser: !!user, error: userError?.message ?? null });
  }

  if (!user) {
    redirect("/login?next=/account/listings");
  }

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id,title,price_eur,created_at,image_urls")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load listings:", error);
  }

  const ownedListings: Listing[] = listings ?? [];

  return (
    <main className="container" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={styles.h1}>My Listings</h1>
          <p style={styles.p}>Signed in as {user.email ?? user.id}</p>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Post a listing
        </Link>
      </div>

      {ownedListings.length === 0 ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={styles.title}>No listings yet</div>
          <p style={styles.text}>Create your first listing to get started.</p>
          <Link className="btn btn-secondary" href="/sell">
            Create listing
          </Link>
        </section>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {ownedListings.map((listing) => {
            const thumb =
              listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0
                ? listing.image_urls[0]
                : null;
            return (
              <Link key={listing.id} className="card" href={`/listings/${listing.id}`} style={styles.card}>
                {thumb ? (
                  <div
                    style={{
                      width: "100%",
                      height: 180,
                      borderRadius: 12,
                      marginBottom: 12,
                      backgroundImage: `url(${thumb})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 180,
                      borderRadius: 12,
                      marginBottom: 12,
                      background: "var(--soft)",
                      border: "1px solid var(--border)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--muted)",
                      fontWeight: 650,
                    }}
                  >
                    No photo
                  </div>
                )}
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={styles.title}>{listing.title}</div>
                  <div style={{ color: "var(--text)", fontWeight: 700 }}>{formatPrice(listing.price_eur)}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    Posted {new Date(listing.created_at).toLocaleDateString("en-IE")}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  card: { padding: 16, display: "block", borderRadius: 18, border: "1px solid var(--border)" },
  title: { fontWeight: 950, color: "var(--green-900)" },
  text: { color: "var(--muted)", fontWeight: 650 },
};
