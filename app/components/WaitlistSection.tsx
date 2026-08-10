"use client";

import { FormEvent, useState } from "react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <section
      className="card"
      style={{
        padding: "28px 24px",
        background: "var(--green-900)",
        border: "none",
        borderRadius: "var(--radius)",
      }}
    >
      {success ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: "#ffffff", marginBottom: 6 }}>
            You&apos;re on the list!
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 650, fontSize: 15 }}>
            We&apos;ll let you know when new listings go up. Check your inbox for a confirmation.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase" }}>
              Stay in the loop
            </span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 950, color: "#ffffff" }}>
            Get notified when new listings go up
          </h2>
          <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.75)", fontWeight: 650, fontSize: 15 }}>
            Be the first to see new enthusiast cars, parts and memorabilia listed in Ireland.
          </p>

          <form onSubmit={onSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ flex: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#ffffff",
                    color: "var(--green-900)",
                    fontWeight: 800,
                    border: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {loading ? "Joining…" : "Join the list"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(220,38,38,0.2)",
                border: "1px solid rgba(220,38,38,0.4)",
                color: "#fca5a5",
                fontWeight: 700,
                fontSize: 14,
              }}>
                {error}
              </div>
            )}
          </form>

          <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600 }}>
            No spam. Unsubscribe any time.
          </p>
        </>
      )}
    </section>
  );
}
