"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container">Loading…</main>}>
      <LoginContent />
    </Suspense>
  );
}

type Mode = "signin" | "signup";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const nextParam = searchParams.get("next");
  const sanitizedNext = useMemo(() => {
    const disallowed = new Set(["/login", "/signin", "/auth/callback"]);
    const rawCandidate = nextParam?.startsWith("/") ? nextParam : nextParam ? `/${nextParam}` : null;
    if (!rawCandidate) return "/browse";
    if (disallowed.has(rawCandidate)) return "/browse";
    return rawCandidate;
  }, [nextParam]);
  const targetPath = sanitizedNext === pathname ? "/browse" : sanitizedNext;
  const shouldRedirect = targetPath !== pathname;

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!shouldRedirect || hasRedirected.current) return;
      if (data.session?.user) {
        hasRedirected.current = true;
        if (process.env.NODE_ENV !== "production") {
          console.debug("Login auto-redirect (session)", { target: targetPath, current: pathname });
        }
        router.replace(targetPath);
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [router, targetPath, shouldRedirect, pathname]);

  async function syncServerSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token || !session?.refresh_token) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("No session available to sync");
        }
        return;
      }
      const res = await fetch("/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });
      if (!res.ok && process.env.NODE_ENV !== "production") {
        console.debug("Failed to set server session", await res.text());
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("Failed to sync auth session", error);
      }
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const emailValue = email.trim().toLowerCase();
    const passwordValue = password.trim();

    if (!emailValue) {
      setError("Email is required.");
      return;
    }

    if (!passwordValue) {
      setError("Password is required.");
      return;
    }

    if (mode === "signup" && passwordValue.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue,
        password: passwordValue,
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        await syncServerSession();
      }

      if (data.session && !hasRedirected.current && shouldRedirect) {
        hasRedirected.current = true;
        if (process.env.NODE_ENV !== "production") {
          console.debug("Login redirect after signup", { target: targetPath, current: pathname });
        }
        router.replace(targetPath);
        return;
      }

      setMessage("Check your email to confirm, then sign in with your password.");
      setMode("signin");
      setPassword("");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    await syncServerSession();

    if (!hasRedirected.current && shouldRedirect) {
      hasRedirected.current = true;
      if (process.env.NODE_ENV !== "production") {
        console.debug("Login redirect after signin", { target: targetPath, current: pathname });
      }
      router.replace(targetPath);
    }
  }

  return (
    <main className="container">
      <div className="card" style={styles.card}>
        <span className="pill">{mode === "signin" ? "Welcome back" : "Join the marketplace"}</span>
        <h1 style={styles.h1}>{mode === "signin" ? "Sign in" : "Create an account"}</h1>
        <p style={styles.p}>Use your email and password to continue.</p>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            className={mode === "signin" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => {
              setMode("signin");
              setMessage(null);
              setError(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => {
              setMode("signup");
              setMessage(null);
              setError(null);
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <label style={styles.label}>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label style={styles.label}>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        {message ? (
          <div className="card" style={styles.notice}>
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="card" style={styles.error}>
            {error}
          </div>
        ) : null}

        <div style={{ marginTop: 16, color: "var(--muted)", fontWeight: 650 }}>
          Continue exploring?{" "}
          <Link href="/browse" style={{ fontWeight: 850 }}>
            Skip for now
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  card: { padding: 22, maxWidth: 520, margin: "0 auto" },
  h1: { margin: "8px 0 0", fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  label: { marginTop: 12, display: "block", fontWeight: 800, color: "var(--green-900)" },
  notice: {
    marginTop: 14,
    padding: 12,
    background: "rgba(16,185,129,0.08)",
    border: "1px solid rgba(5,150,105,0.3)",
    fontWeight: 700,
    color: "var(--green-900)",
  },
  error: {
    marginTop: 14,
    padding: 12,
    background: "rgba(220,38,38,0.08)",
    border: "1px solid rgba(220,38,38,0.3)",
    fontWeight: 700,
    color: "rgba(153,27,27,1)",
  },
};
