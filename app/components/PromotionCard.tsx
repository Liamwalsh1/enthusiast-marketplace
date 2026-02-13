"use client";

import { useState, type CSSProperties } from "react";

type Props = {
  listingId: string;
  boostedUntil: string | null;
  featuredUntil: string | null;
};

export default function PromotionCard({ listingId, boostedUntil, featuredUntil }: Props) {
  const [loading, setLoading] = useState<"boost" | "featured" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const isBoosted = boostedUntil && new Date(boostedUntil) > now;
  const isFeatured = featuredUntil && new Date(featuredUntil) > now;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePurchase = async (product: "boost" | "featured") => {
    setLoading(product);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, product }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="card" style={styles.card}>
      <div style={styles.header}>Promote this listing</div>

      {/* Current promotion status */}
      {(isBoosted || isFeatured) && (
        <div style={styles.statusRow}>
          {isBoosted && (
            <div style={styles.activeBadge}>
              Boosted until {formatDate(boostedUntil!)}
            </div>
          )}
          {isFeatured && (
            <div style={styles.activeBadge}>
              Featured until {formatDate(featuredUntil!)}
            </div>
          )}
        </div>
      )}

      <div style={styles.optionsRow}>
        <div style={styles.option}>
          <div style={styles.optionHeader}>
            <span style={styles.optionTitle}>Boost</span>
            <span style={styles.optionPrice}>€7</span>
          </div>
          <p style={styles.optionDesc}>
            Rank higher in browse &amp; search results for 7 days
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => handlePurchase("boost")}
            disabled={loading !== null || !!isBoosted}
            style={styles.optionBtn}
          >
            {loading === "boost"
              ? "Loading..."
              : isBoosted
              ? "Already boosted"
              : "Boost now"}
          </button>
        </div>

        <div style={styles.option}>
          <div style={styles.optionHeader}>
            <span style={styles.optionTitle}>Featured</span>
            <span style={styles.optionPrice}>€15</span>
          </div>
          <p style={styles.optionDesc}>
            Appear on homepage + boost for 7 days
          </p>
          <button
            className="btn btn-primary"
            onClick={() => handlePurchase("featured")}
            disabled={loading !== null || !!isFeatured}
            style={styles.optionBtn}
          >
            {loading === "featured"
              ? "Loading..."
              : isFeatured
              ? "Already featured"
              : "Feature now"}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>{error}</div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    padding: 16,
    display: "grid",
    gap: 12,
  },
  header: {
    fontWeight: 950,
    color: "var(--green-900)",
  },
  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  activeBadge: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "rgb(6, 95, 70)",
    fontSize: 13,
    fontWeight: 700,
  },
  optionsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  option: {
    padding: 14,
    borderRadius: 12,
    background: "var(--soft)",
    border: "1px solid var(--border)",
    display: "grid",
    gap: 8,
  },
  optionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionTitle: {
    fontWeight: 800,
    color: "var(--green-900)",
  },
  optionPrice: {
    fontWeight: 900,
    color: "var(--green-900)",
    fontSize: 18,
  },
  optionDesc: {
    margin: 0,
    fontSize: 13,
    fontWeight: 650,
    color: "var(--muted)",
    lineHeight: 1.4,
  },
  optionBtn: {
    marginTop: 4,
  },
  error: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(220, 38, 38, 0.1)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    color: "rgb(153, 27, 27)",
    fontSize: 13,
    fontWeight: 650,
  },
};
