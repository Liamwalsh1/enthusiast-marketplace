"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia";
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  created_at: string;
};

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function labelCategory(cat: Listing["category"]) {
  if (cat === "car") return "Car";
  if (cat === "part") return "Part";
  return "Memorabilia";
}

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("listings")
        .select("id,title,category,price_eur,location,condition,created_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) setErrorMsg(error.message);
      setListings((data ?? []) as Listing[]);
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="container">
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.h1}>Browse</h1>
          <p style={styles.p}>Live listings from Supabase.</p>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Post an ad
        </Link>
      </div>

      {loading ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>Loading listings…</div>
          <div style={styles.muted}>One moment.</div>
        </section>
      ) : errorMsg ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>Couldn’t load listings</div>
          <div style={styles.muted}>{errorMsg}</div>
        </section>
      ) : listings.length === 0 ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>No listings yet</div>
          <div style={styles.muted}>Create one on the Sell page and it will show here.</div>
        </section>
      ) : (
        <section style={{ marginTop: 14 }} className="grid-3">
          {listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="card" style={styles.listingCard}>
              <div style={styles.badges}>
                <span className="pill">{labelCategory(l.category)}</span>
                <span className="pill">{l.location ?? "—"}</span>
                <span className="pill">{l.condition ?? "—"}</span>
              </div>
              <div style={styles.listingTitle}>{l.title}</div>
              <div style={styles.price}>{formatPrice(l.price_eur)}</div>
              <div style={styles.meta}>View details</div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" },
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  cardPad: { padding: 16, marginTop: 12 },
  title: { fontWeight: 950, color: "var(--green-900)" },
  muted: { color: "var(--muted)", fontWeight: 650, marginTop: 6 },

  listingCard: { padding: 16, display: "grid", gap: 8 },
  badges: { display: "flex", gap: 8, flexWrap: "wrap" },
  listingTitle: { fontWeight: 900, color: "var(--green-900)" },
  price: { fontWeight: 900, fontSize: 18 },
  meta: { color: "var(--muted)", fontWeight: 650, fontSize: 13 },
};
