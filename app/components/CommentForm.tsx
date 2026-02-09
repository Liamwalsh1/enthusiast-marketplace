"use client";

import { FormEvent, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  listingId: string;
  parentId: string | null;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isLoggedIn?: boolean;
};

export default function CommentForm({
  listingId,
  parentId,
  placeholder = "Write a comment...",
  onSuccess,
  onCancel,
  isLoggedIn = true,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const successTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSessionExpired(false);

    const trimmed = body.trim();
    if (!trimmed) {
      setError("Comment cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        setLoading(false);
        setError("Your session expired. Please sign in again.");
        setSessionExpired(true);
        return;
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          parentId,
          body: trimmed,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Failed to post comment.");
        setLoading(false);
        if (res.status === 401 || res.status === 403) {
          setSessionExpired(true);
        }
        return;
      }

      setBody("");
      setLoading(false);
      setSuccess("Comment posted");

      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
      successTimer.current = setTimeout(() => {
        setSuccess(null);
      }, 2000);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setLoading(false);
      const detail =
        err && typeof err === "object" && "message" in err
          ? (err as { message?: string }).message ?? "Unexpected error."
          : "Unexpected error.";
      setError(detail);
    }
  }

  const isReply = parentId !== null;

  if (!isLoggedIn) {
    return (
      <div style={signInPromptStyles}>
        <Link
          href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
          className="btn btn-primary"
        >
          Sign in to comment
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
      <textarea
        className="textarea"
        rows={isReply ? 2 : 3}
        maxLength={2000}
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ minHeight: isReply ? 60 : 80 }}
      />

      {error && (
        <div style={errorStyles}>
          <div>{error}</div>
          {sessionExpired && (
            <Link
              className="btn btn-secondary"
              href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
              style={{ marginTop: 8 }}
            >
              Sign in again
            </Link>
          )}
        </div>
      )}

      {success && <div style={successStyles}>{success}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || body.trim().length === 0}
        >
          {loading ? "Posting..." : isReply ? "Reply" : "Post Comment"}
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

const errorStyles: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.3)",
  background: "rgba(220,38,38,.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
};

const successStyles: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(34,197,94,.3)",
  background: "rgba(34,197,94,0.1)",
  color: "var(--green-900)",
  fontWeight: 700,
};

const signInPromptStyles: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "var(--soft)",
  border: "1px solid var(--border)",
  textAlign: "center",
};
