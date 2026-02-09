"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import CommentForm from "./CommentForm";
import FlagModal from "./FlagModal";
import type { CommentWithReplies } from "@/app/types/comments";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  comment: CommentWithReplies;
  listingId: string;
  currentUserId: string | null;
  depth: number;
  maxDepth: number;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDisplayName(displayName: string | null | undefined, email: string | undefined): string {
  if (displayName) return displayName;
  if (!email) return "Anonymous";
  return email.split("@")[0];
}

export default function CommentThread({
  comment,
  listingId,
  currentUserId,
  depth,
  maxDepth,
}: Props) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const isSeller = comment.is_seller;
  const isDeleted = comment.is_deleted;
  const isLoggedIn = currentUserId !== null;

  const visualDepth = Math.min(depth, maxDepth);
  const indentPx = visualDepth * 24;

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        alert("Your session expired. Please sign in again.");
        setDeleting(false);
        return;
      }

      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete comment.");
        setDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to delete comment.");
      setDeleting(false);
    }
  }

  function handleReplySuccess() {
    setShowReplyForm(false);
    router.refresh();
  }

  return (
    <div style={{ marginLeft: indentPx }}>
      <div style={commentContainerStyles}>
        <div style={headerStyles}>
          <span style={usernameStyles}>{getDisplayName(comment.display_name, comment.user_email)}</span>
          {isSeller && <span style={sellerBadgeStyles}>Seller</span>}
          <span style={timestampStyles}>{formatTimeAgo(comment.created_at)}</span>
        </div>

        <div style={bodyStyles}>
          {isDeleted ? (
            <em style={{ color: "var(--muted)" }}>[Comment deleted]</em>
          ) : (
            comment.body
          )}
        </div>

        {!isDeleted && (
          <div style={actionsStyles}>
            {isLoggedIn && (
              <button
                type="button"
                style={actionButtonStyles}
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                Reply
              </button>
            )}
            {isLoggedIn && !isOwner && (
              <button
                type="button"
                style={actionButtonStyles}
                onClick={() => setShowFlagModal(true)}
              >
                Flag
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                style={{ ...actionButtonStyles, color: "rgba(220,38,38,1)" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        )}

        {showReplyForm && (
          <div style={{ marginTop: 12 }}>
            <CommentForm
              listingId={listingId}
              parentId={comment.id}
              placeholder="Write a reply..."
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              listingId={listingId}
              currentUserId={currentUserId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

      <FlagModal
        open={showFlagModal}
        commentId={comment.id}
        onClose={() => setShowFlagModal(false)}
      />
    </div>
  );
}

const commentContainerStyles: CSSProperties = {
  padding: 12,
  marginTop: 8,
  borderRadius: 12,
  background: "var(--soft)",
  border: "1px solid var(--border)",
};

const headerStyles: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 6,
  flexWrap: "wrap",
};

const usernameStyles: CSSProperties = {
  fontWeight: 750,
  color: "var(--green-900)",
  fontSize: 14,
};

const sellerBadgeStyles: CSSProperties = {
  display: "inline-flex",
  padding: "2px 8px",
  borderRadius: 999,
  background: "var(--green-900)",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
};

const timestampStyles: CSSProperties = {
  color: "var(--muted)",
  fontSize: 12,
  fontWeight: 600,
};

const bodyStyles: CSSProperties = {
  color: "var(--text)",
  fontWeight: 600,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const actionsStyles: CSSProperties = {
  display: "flex",
  gap: 12,
  marginTop: 8,
};

const actionButtonStyles: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "var(--muted)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
