"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";
import StarRating from "./StarRating";

export type Review = {
  id: string;
  seller_id: string;
  reviewer_id: string;
  listing_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  reviewer_email?: string;
  reviewer_display_name?: string | null;
  listing_title?: string | null;
};

type Props = {
  reviews: Review[];
  currentUserId: string | null;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString("en-IE");
}

function getDisplayName(displayName: string | null | undefined, email: string | undefined): string {
  if (displayName) return displayName;
  if (!email) return "Anonymous";
  return email.split("@")[0];
}

export default function ReviewList({ reviews, currentUserId }: Props) {
  if (reviews.length === 0) {
    return (
      <div style={{ color: "var(--muted)", fontWeight: 650, padding: 16, textAlign: "center" }}>
        No reviews yet. Be the first to leave one!
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          isOwner={currentUserId === review.reviewer_id}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review, isOwner }: { review: Review; isOwner: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this review?")) return;
    if (deleting) return;
    setDeleting(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        alert("Your session expired. Please sign in again.");
        setDeleting(false);
        return;
      }

      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete review.");
        setDeleting(false);
      }
    } catch {
      alert("Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div style={styles.reviewCard}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <StarRating rating={review.rating} size={16} />
          <span style={styles.reviewer}>
            {getDisplayName(review.reviewer_display_name, review.reviewer_email)}
          </span>
          <span style={styles.date}>{formatTimeAgo(review.created_at)}</span>
        </div>
        {isOwner && (
          <button
            type="button"
            style={styles.deleteButton}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "..." : "Delete"}
          </button>
        )}
      </div>

      {review.title && <div style={styles.title}>{review.title}</div>}

      {review.body && <div style={styles.body}>{review.body}</div>}

      {review.listing_title && (
        <div style={styles.listingRef}>
          For listing: {review.listing_title}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  reviewCard: {
    padding: 12,
    borderRadius: 12,
    background: "var(--soft)",
    border: "1px solid var(--border)",
    display: "grid",
    gap: 8,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  reviewer: {
    fontWeight: 800,
    color: "var(--green-900)",
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 650,
  },
  deleteButton: {
    background: "none",
    border: "none",
    padding: 0,
    color: "rgba(220,38,38,1)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  title: {
    fontWeight: 800,
    color: "var(--green-900)",
  },
  body: {
    color: "var(--text)",
    fontWeight: 600,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  listingRef: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 650,
    fontStyle: "italic",
  },
};
