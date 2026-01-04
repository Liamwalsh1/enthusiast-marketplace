"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  listingId: string;
  listingTitle: string;
  sellerId: string | null;
};

export default function MessageSellerCard({ listingId, listingTitle, sellerId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(`Hi! Is "${listingTitle}" still available?`);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const loggedBranch = useRef<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data.user ?? null);
      setCheckingAuth(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const branch = useMemo(() => {
    if (!sellerId) return "missing-seller";
    if (checkingAuth) return "checking";
    if (!user) return "require-login";
    if (user.id === sellerId) return "viewer-owner";
    return "can-message";
  }, [checkingAuth, sellerId, user]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (loggedBranch.current === branch) return;
    loggedBranch.current = branch;
    console.debug("MessageSellerCard branch:", {
      branch,
      listingId,
      sellerId,
      userId: user?.id ?? null,
    });
  }, [branch, listingId, sellerId, user]);

  async function startConversation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    setSessionExpired(false);

    const synced = await ensureServerSession();
    if (!synced) {
      setError("Your session expired. Please sign in again.");
      setSessionExpired(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          message,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error ?? "Failed to start conversation.");
        setLoading(false);
        if (res.status === 401 || res.status === 403) {
          setSessionExpired(true);
        }
        return;
      }

      const payload = (await res.json()) as { threadId: string };
      router.push(`/messages/${payload.threadId}`);
    } catch (err) {
      setLoading(false);
      const detail =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: string }).message === "string"
          ? (err as { message?: string }).message ?? "Unexpected error."
          : "Unexpected error.";
      setError(detail);
    }
  }

  if (!sellerId) {
    return (
      <div className="card" style={cardStyles.card}>
        <div style={cardStyles.title}>Seller unavailable</div>
        <div style={cardStyles.text}>This listing is missing an owner. Try again later.</div>
      </div>
    );
  }

  if (checkingAuth && sellerId) {
    return (
      <div className="card" style={cardStyles.card}>
        <div style={cardStyles.title}>Checking sign-in…</div>
        <p style={cardStyles.text}>Please wait a moment.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card" style={cardStyles.card}>
        <div style={cardStyles.title}>Sign in to message</div>
        <p style={cardStyles.text}>You need an account to contact the seller.</p>
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}>
          Sign in
        </Link>
      </div>
    );
  }

  if (user.id === sellerId) {
    return (
      <div className="card" style={cardStyles.card}>
        <div style={cardStyles.title}>You created this listing</div>
        <p style={cardStyles.text}>Edit it from your account (coming soon).</p>
      </div>
    );
  }

  return (
    <div className="card" style={cardStyles.card}>
      <div style={cardStyles.title}>Message seller</div>
      <form onSubmit={startConversation} style={{ marginTop: 8 }}>
        <textarea
          className="textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Introduce yourself and ask the right questions…"
        />

        {error ? (
          <div className="card" style={cardStyles.error}>
            <div>{error}</div>
            {sessionExpired ? (
              <Link
                className="btn btn-secondary"
                href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
                style={{ marginTop: 8, justifySelf: "start" }}
              >
                Sign in again
              </Link>
            ) : null}
          </div>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={loading || message.trim().length === 0}>
          {loading ? "Starting thread…" : "Send message"}
        </button>
      </form>
    </div>
  );
}

const cardStyles: Record<string, CSSProperties> = {
  card: { padding: 16, display: "grid", gap: 12 },
  title: { fontWeight: 950, color: "var(--green-900)" },
  text: { color: "var(--muted)", fontWeight: 650 },
  error: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(220,38,38,.3)",
    background: "rgba(220,38,38,.08)",
    color: "rgba(153,27,27,1)",
    fontWeight: 700,
  },
};
