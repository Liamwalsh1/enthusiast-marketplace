"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase parses the token from the URL hash automatically on the client.
    // We just need to wait for the session to be established.
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.replace("/account"), 2500);
  }

  if (done) {
    return (
      <main className="container">
        <div className="card" style={{ padding: 22, maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontSize: 30, fontWeight: 950, color: "var(--green-900)", marginBottom: 10 }}>Password updated</h1>
          <p style={{ color: "var(--muted)", fontWeight: 650 }}>Your password has been changed. Redirecting you to your account…</p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="container">
        <div className="card" style={{ padding: 22, maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontSize: 30, fontWeight: 950, color: "var(--green-900)", marginBottom: 10 }}>Reset password</h1>
          <p style={{ color: "var(--muted)", fontWeight: 650 }}>Verifying your reset link…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card" style={{ padding: 22, maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, fontWeight: 950, color: "var(--green-900)", margin: "0 0 6px" }}>
          Choose a new password
        </h1>
        <p style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 16 }}>
          Must be at least 6 characters.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ fontWeight: 800, color: "var(--green-900)" }}>New Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />

          <label style={{ fontWeight: 800, color: "var(--green-900)" }}>Confirm Password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />

          {error && (
            <div className="card" style={{ padding: 12, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", fontWeight: 700, color: "rgba(153,27,27,1)" }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
