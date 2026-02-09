"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StarRating from "./StarRating";

type Props = {
  sellerId: string;
  showCount?: boolean;
  size?: number;
  linkToProfile?: boolean;
};

type Stats = {
  avg_rating: number | null;
  review_count: number;
};

export default function SellerRatingBadge({
  sellerId,
  showCount = true,
  size = 14,
  linkToProfile = true,
}: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/sellers/${sellerId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [sellerId]);

  if (loading) {
    return null;
  }

  if (!stats || stats.review_count === 0) {
    const content = (
      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 650 }}>
        New seller
      </span>
    );

    if (linkToProfile) {
      return (
        <Link href={`/sellers/${sellerId}`} style={{ textDecoration: "none" }}>
          {content}
        </Link>
      );
    }
    return content;
  }

  const badgeContent = (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <StarRating rating={stats.avg_rating ?? 0} size={size} />
      <span style={{ color: "var(--green-900)", fontWeight: 800, fontSize: 13 }}>
        {stats.avg_rating?.toFixed(1)}
      </span>
      {showCount && (
        <span style={{ color: "var(--muted)", fontWeight: 650, fontSize: 12 }}>
          ({stats.review_count})
        </span>
      )}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/sellers/${sellerId}`}
        style={{ textDecoration: "none" }}
        title="View seller profile"
      >
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
}
