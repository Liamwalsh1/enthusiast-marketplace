import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import UnsaveButton from "./UnsaveButton";

export const dynamic = "force-dynamic";

type SavedListing = {
  id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    category: "car" | "part" | "memorabilia" | "wheels";
    price_eur: number | null;
    location: string | null;
    condition: string | null;
    status: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
    created_at: string;
    wheel_diameter: number | null;
    wheel_width: number | null;
    wheel_brand: string | null;
    bolt_pattern: string | null;
  } | null;
};

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function labelCategory(cat: "car" | "part" | "memorabilia" | "wheels") {
  if (cat === "car") return "Car";
  if (cat === "wheels") return "Wheels";
  if (cat === "part") return "Part";
  return "Memorabilia";
}

export default async function SavedListingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/saved");
  }

  const { data: savedListings, error } = await supabase
    .from("saved_listings")
    .select(`
      id,
      created_at,
      listing:listings (
        id,
        title,
        category,
        price_eur,
        location,
        condition,
        status,
        make,
        model,
        year,
        created_at,
        wheel_diameter,
        wheel_width,
        wheel_brand,
        bolt_pattern
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (savedListings ?? []) as unknown as SavedListing[];
  // Filter out any saved listings where the listing was deleted
  const validItems = items.filter((item) => item.listing !== null);

  return (
    <main className="container" style={{ display: "grid", gap: 16 }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Saved Listings</h1>
          <p style={styles.p}>
            {validItems.length} saved listing{validItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link className="btn btn-secondary" href="/account">
          Back to Account
        </Link>
      </div>

      {error ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
            Unable to load saved listings
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>
            {error.message}
          </div>
        </section>
      ) : validItems.length === 0 ? (
        <section className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)", marginBottom: 8 }}>
            No saved listings yet
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 16 }}>
            Browse listings and click the save button to add them here.
          </div>
          <Link className="btn btn-primary" href="/browse">
            Browse Listings
          </Link>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {validItems.map((item) => {
            const listing = item.listing!;
            const isSold = listing.status === "sold";

            return (
              <div key={item.id} className="card" style={styles.listingCard}>
                <div style={styles.cardContent}>
                  <div style={styles.badges}>
                    <span className="pill">{labelCategory(listing.category)}</span>
                    {listing.location && <span className="pill">{listing.location}</span>}
                    {isSold && (
                      <span
                        className="pill"
                        style={{
                          background: "rgba(220,38,38,0.1)",
                          border: "1px solid rgba(220,38,38,0.4)",
                          color: "rgba(153,27,27,1)",
                          fontWeight: 900,
                        }}
                      >
                        SOLD
                      </span>
                    )}
                  </div>

                  <Link href={`/listings/${listing.id}`} style={styles.titleLink}>
                    {listing.title}
                  </Link>

                  {listing.category === "car" && (listing.make || listing.model || listing.year) && (
                    <div style={styles.specs}>
                      {listing.year && <span>{listing.year}</span>}
                      {listing.make && <span>{listing.make}</span>}
                      {listing.model && <span>{listing.model}</span>}
                    </div>
                  )}

                  {listing.category === "wheels" && (listing.wheel_diameter || listing.wheel_brand || listing.bolt_pattern) && (
                    <div style={styles.specs}>
                      {listing.wheel_diameter && listing.wheel_width && (
                        <span>{listing.wheel_diameter}&quot;x{listing.wheel_width}&quot;</span>
                      )}
                      {listing.bolt_pattern && <span>{listing.bolt_pattern}</span>}
                      {listing.wheel_brand && <span>{listing.wheel_brand}</span>}
                    </div>
                  )}

                  <div style={styles.price}>{formatPrice(listing.price_eur)}</div>
                </div>

                <div style={styles.actions}>
                  <Link className="btn btn-primary" href={`/listings/${listing.id}`}>
                    View
                  </Link>
                  <UnsaveButton listingId={listing.id} />
                </div>
              </div>
            );
          })}
        </div>
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
  listingCard: {
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  cardContent: {
    display: "grid",
    gap: 8,
    flex: 1,
    minWidth: 200,
  },
  badges: { display: "flex", gap: 8, flexWrap: "wrap" },
  titleLink: {
    fontWeight: 900,
    color: "var(--green-900)",
    fontSize: 18,
    textDecoration: "none",
  },
  specs: {
    display: "flex",
    gap: 12,
    fontSize: 13,
    color: "var(--muted)",
    fontWeight: 650,
  },
  price: { fontWeight: 900, fontSize: 18 },
  actions: { display: "flex", gap: 8, flexShrink: 0 },
};
