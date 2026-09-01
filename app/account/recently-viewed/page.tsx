"use client";

import Link from "next/link";
import { useState, useEffect, type CSSProperties } from "react";
import { getRecentlyViewed, clearRecentlyViewed, type RecentlyViewedItem } from "@/app/lib/recentlyViewed";

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}

function labelCategory(cat: string) {
  if (cat === "car") return "Car";
  return "Wheels";
}

export default function RecentlyViewedPage() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setItems(getRecentlyViewed());
    setIsLoading(false);
  }, []);

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  return (
    <main className="container">
      <div className="page-top-row">
        <div>
          <h1 className="page-title">Recently Viewed</h1>
          <p style={styles.subtitle}>Listings you&apos;ve looked at recently</p>
        </div>
        {items.length > 0 && (
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear history
          </button>
        )}
      </div>

      {isLoading ? (
        <section className="card" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>Loading...</div>
        </section>
      ) : items.length === 0 ? (
        <section className="card" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)", marginBottom: 8 }}>
            No recently viewed listings
          </div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 16 }}>
            When you view listings, they&apos;ll appear here for easy access.
          </p>
          <Link className="btn btn-primary" href="/browse">
            Browse listings
          </Link>
        </section>
      ) : (
        <div className="grid-3" style={{ marginTop: 16 }}>
          {items.map((item) => (
            <Link key={item.id} href={`/listings/${item.id}`} className="card" style={styles.card}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} style={styles.image} />
              ) : (
                <div style={styles.noImage}>No image</div>
              )}
              <div style={styles.content}>
                <div style={styles.badges}>
                  <span className="pill">{labelCategory(item.category)}</span>
                  <span style={styles.timeAgo}>{formatTimeAgo(item.viewedAt)}</span>
                </div>
                <div style={styles.title}>{item.title}</div>
                <div style={styles.price}>{formatPrice(item.price_eur)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <Link href="/account" style={styles.backLink}>
          ← Back to Account
        </Link>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  subtitle: {
    margin: "6px 0 0",
    color: "var(--muted)",
    fontWeight: 650,
  },
  card: {
    display: "block",
    padding: 0,
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
  },
  image: {
    width: "100%",
    height: 160,
    objectFit: "cover",
  },
  noImage: {
    width: "100%",
    height: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--soft)",
    color: "var(--muted)",
    fontWeight: 700,
    fontSize: 14,
  },
  content: {
    padding: 14,
    display: "grid",
    gap: 8,
  },
  badges: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  timeAgo: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 650,
  },
  title: {
    fontWeight: 900,
    color: "var(--green-900)",
  },
  price: {
    fontWeight: 900,
    fontSize: 18,
    color: "var(--green-900)",
  },
  backLink: {
    color: "var(--green-900)",
    fontWeight: 700,
    textDecoration: "none",
  },
};
