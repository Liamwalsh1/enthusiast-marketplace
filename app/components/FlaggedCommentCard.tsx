"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FlaggedComment = {
  flag_id: string;
  comment_id: string;
  comment_body: string;
  comment_user_id: string;
  comment_user_email: string;
  comment_is_deleted: boolean;
  listing_id: string;
  listing_title: string;
  flag_reason: string;
  flag_status: string;
  flagged_by: string;
  flagger_email: string;
  flagged_at: string;
};

type Props = {
  flag: FlaggedComment;
  adminId: string;
};

export default function FlaggedCommentCard({ flag, adminId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDismiss() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flags/${flag.flag_id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment() {
    if (!confirm("Are you sure you want to delete this comment? This will soft-delete it and mark the flag as reviewed.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments/${flag.comment_id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId: flag.flag_id, adminId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 16,
        border: flag.comment_is_deleted
          ? "1px solid var(--border)"
          : "1px solid rgba(234,179,8,0.4)",
        background: flag.comment_is_deleted ? "var(--soft)" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, color: "var(--green-900)", marginBottom: 4 }}>
            Flagged Comment
          </div>
          <Link
            href={`/listings/${flag.listing_id}`}
            style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13 }}
          >
            On: {flag.listing_title || "Listing"}
          </Link>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            Flagged {formatDate(flag.flagged_at)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            by {flag.flagger_email || "Unknown"}
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "12px 0",
          padding: 12,
          borderRadius: 10,
          background: flag.comment_is_deleted ? "rgba(220,38,38,0.05)" : "var(--soft)",
          border: flag.comment_is_deleted
            ? "1px solid rgba(220,38,38,0.2)"
            : "1px solid var(--border)",
        }}
      >
        {flag.comment_is_deleted ? (
          <div style={{ fontStyle: "italic", color: "var(--muted)" }}>[Comment deleted]</div>
        ) : (
          <div style={{ fontWeight: 650, color: "var(--text)", whiteSpace: "pre-wrap" }}>
            {flag.comment_body}
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
          Posted by: {flag.comment_user_email || "Unknown"}
        </div>
      </div>

      <div
        style={{
          padding: 10,
          borderRadius: 8,
          background: "rgba(234,179,8,0.1)",
          border: "1px solid rgba(234,179,8,0.3)",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(161,98,7,0.8)", textTransform: "uppercase", marginBottom: 4 }}>
          Flag Reason
        </div>
        <div style={{ fontWeight: 650, color: "rgba(161,98,7,1)" }}>{flag.flag_reason}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!flag.comment_is_deleted && (
          <button
            onClick={handleDeleteComment}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "rgba(220,38,38,1)",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            Delete Comment
          </button>
        )}
        <button
          onClick={handleDismiss}
          disabled={loading}
          className="btn btn-secondary"
        >
          {flag.comment_is_deleted ? "Mark Reviewed" : "Dismiss Flag"}
        </button>
        <Link
          href={`/listings/${flag.listing_id}`}
          className="btn btn-secondary"
        >
          View Listing
        </Link>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
