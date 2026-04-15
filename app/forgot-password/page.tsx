"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="container">
      <div className="card" style={{ padding: 22, maxWidth: 520, margin: "0 auto" }}>
        <Link className="pill" href="/login" style={{ display: "inline-block", marginBottom: 16 }}>← Back to sign in</Link>

        <h1 style={{ fontSize: 30, fontWeight: 950, color: "var(--green-900)", margin: "0 0 6px" }}>
          Reset password
        </h1>

        {sent ? (
          <div>
            <p style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 16 }}>
              Check your inbox — we&apos;ve sent a password reset link to <strong style={{ color: "var(--text)" }}>{email}</strong>.
            </p>
            <div className="card" style={{ padding: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(5,150,105,0.3)", fontWeight: 700, color: "var(--green-900)" }}>
              The link expires after 1 hour. Check your spam folder if you don&apos;t see it.
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 16 }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <label style={{ fontWeight: 800, color: "var(--green-900)" }}>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              {error && (
                <div className="card" style={{ padding: 12, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", fontWeight: 700, color: "rgba(153,27,27,1)" }}>
                  {error}
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
