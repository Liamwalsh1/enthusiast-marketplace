"use client";

import { useEffect, useState } from "react";
import ListingCard from "./ListingCard";

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia" | "wheels";
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  image_urls?: string[] | null;
  blur_data_urls?: string[] | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  transmission?: string | null;
  wheel_brand?: string | null;
  wheel_diameter?: number | null;
};

export default function ExploreSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  async function fetchListings() {
    try {
      const res = await fetch("/api/listings/explore");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings ?? []);
      }
    } finally {
      setLoading(false);
      setShuffling(false);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  async function handleShuffle() {
    setShuffling(true);
    await fetchListings();
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 240, borderRadius: 16, background: "var(--soft)", border: "1px solid var(--border)" }} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) return null;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} isLoggedIn={isLoggedIn} showCategory />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <button
          onClick={handleShuffle}
          disabled={shuffling}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "white",
            color: "var(--green-900)",
            fontWeight: 700,
            fontSize: 14,
            cursor: shuffling ? "wait" : "pointer",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: "transform 0.4s", transform: shuffling ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
          </svg>
          {shuffling ? "Finding listings…" : "Shuffle"}
        </button>
      </div>
    </div>
  );
}
