"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

export default function EarlyAccessBanner() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = document.cookie.split(";").some((c) => c.trim().startsWith("eab_dismissed="));
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `eab_dismissed=1; expires=${expires.toUTCString()}; path=/`;
    setVisible(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setJoined(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🚧</div>
        <div
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--green-900)",
            background: "rgba(20,83,45,0.08)",
            padding: "4px 12px",
            borderRadius: 999,
            marginBottom: 12,
          }}
        >
          Early access
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 950,
            color: "var(--green-900)",
            margin: "0 0 8px",
          }}
        >
          We&apos;re still building!
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontWeight: 650,
            fontSize: 14,
            lineHeight: 1.6,
            margin: "0 0 20px",
          }}
        >
          PassionDriven is in early access — things are taking shape but some features are still being worked on.
        </p>

        {/* Waitlist */}
        <div
          style={{
            background: "var(--green-900)",
            borderRadius: 14,
            padding: "18px 16px",
            marginBottom: 12,
            textAlign: "left",
          }}
        >
          {joined ? (
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#fff", marginBottom: 4 }}>You&apos;re on the list!</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 650 }}>
                We&apos;ll notify you when new listings go up.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 10 }}>
                Get notified when new listings go up
              </div>
              <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontSize: 14,
                  }}
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#fff",
                    color: "var(--green-900)",
                    fontWeight: 800,
                    border: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    fontSize: 13,
                  }}
                >
                  {loading ? "…" : "Notify me"}
                </button>
              </form>
              {error && (
                <div style={{ marginTop: 8, color: "#fca5a5", fontSize: 12, fontWeight: 700 }}>{error}</div>
              )}
            </>
          )}
        </div>

        {/* Sell CTA */}
        <Link
          href="/sell"
          onClick={dismiss}
          style={{
            display: "block",
            padding: "13px 16px",
            borderRadius: 12,
            border: "1.5px solid var(--green-900)",
            color: "var(--green-900)",
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            marginBottom: 16,
            lineHeight: 1.3,
          }}
        >
          Sell your enthusiast car here before we go live →
        </Link>

        <button
          onClick={dismiss}
          className="btn btn-primary"
          style={{ width: "100%", fontSize: 14 }}
        >
          Got it, let me explore
        </button>
        <button
          onClick={dismiss}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontWeight: 650,
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
