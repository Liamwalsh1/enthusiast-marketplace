"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  threadId: string;
};

export default function MessageComposer({ threadId }: Props) {
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

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSessionExpired(false);

    const trimmed = body.trim();
    if (!trimmed) {
      setError("Message cannot be empty.");
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

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ threadId, body: trimmed }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Failed to send message.");
        setLoading(false);
        if (res.status === 401 || res.status === 403) {
          setSessionExpired(true);
        }
        return;
      }

      setBody("");
      setLoading(false);
      setSuccess("Message sent");
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
      successTimer.current = setTimeout(() => {
        setSuccess(null);
      }, 2000);
      router.refresh();
    } catch (err) {
      setLoading(false);
      const detail =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: string }).message === "string"
          ? (err as { message?: string }).message ?? "Unexpected error."
          : "Unexpected error.";
      setError(detail);
    }
  }

  return (
    <form onSubmit={sendMessage} style={{ marginTop: 16, display: "grid", gap: 8 }}>
      <textarea
        className="textarea"
        rows={3}
        maxLength={2000}
        placeholder="Write a message…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      {error ? (
        <div
          className="card"
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(220,38,38,.3)",
            background: "rgba(220,38,38,.08)",
            color: "rgba(153,27,27,1)",
            fontWeight: 700,
          }}
        >
          <div>{error}</div>
          {sessionExpired ? (
            <Link className="btn btn-secondary" href={`/login?next=${encodeURIComponent(`/messages/${threadId}`)}`} style={{ marginTop: 8 }}>
              Sign in again
            </Link>
          ) : null}
        </div>
      ) : null}
      {success ? (
        <div
          className="card"
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(34,197,94,.3)",
            background: "rgba(34,197,94,0.1)",
            color: "var(--green-900)",
            fontWeight: 700,
          }}
        >
          {success}
        </div>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={loading || body.trim().length === 0}>
        {loading ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
