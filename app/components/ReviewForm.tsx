"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/useToast";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";
import StarRating from "./StarRating";

type Props = {
  sellerId: string;
  listingId?: string;
  listingTitle?: string;
  isLoggedIn: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ReviewForm({
  sellerId,
  listingId,
  listingTitle,
  isLoggedIn,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPrompt}>
        <div style={{ fontWeight: 700, color: "var(--green-900)" }}>
          Sign in to leave a review
        </div>
        <a href={`/login?next=/listings/${listingId}`} className="btn btn-primary">
          Sign In
        </a>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (rating === 0) {
      toast({ type: "error", message: "Please select a rating" });
      return;
    }

    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        toast({ type: "error", message: "Your session expired. Please sign in again." });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: sellerId,
          listing_id: listingId || null,
          rating,
          title: title.trim() || null,
          body: body.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast({ type: "success", message: "Review submitted" });
      setRating(0);
      setTitle("");
      setBody("");

      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit review";
      toast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      {listingTitle && (
        <div style={styles.listingContext}>
          Reviewing seller for: <strong>{listingTitle}</strong>
        </div>
      )}

      <div>
        <label style={styles.label}>Rating</label>
        <StarRating
          rating={rating}
          size={28}
          interactive
          onChange={setRating}
        />
      </div>

      <div>
        <label style={styles.label}>Title (optional)</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          disabled={loading}
        />
      </div>

      <div>
        <label style={styles.label}>Review (optional)</label>
        <textarea
          className="textarea"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share details about your experience with this seller..."
          maxLength={1000}
          disabled={loading}
        />
        <div style={styles.charCount}>{body.length}/1000</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={loading || rating === 0}>
          {loading ? "Submitting..." : "Submit Review"}
        </button>
        {onCancel && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  loginPrompt: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    background: "var(--soft)",
    border: "1px solid var(--border)",
  },
  listingContext: {
    fontSize: 13,
    color: "var(--muted)",
    fontWeight: 650,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 650,
    marginTop: 4,
    textAlign: "right",
  },
};
