import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV !== "production") {
    console.debug("Account page user check:", { hasUser: !!user, error: error?.message ?? null });
  }

  if (!user) {
    redirect("/login?next=/account");
  }

  return (
    <main className="container">
      <h1 style={styles.h1}>Account</h1>
      <p style={styles.p}>Signed in as {user.email ?? user.id}</p>

      <div className="grid-3" style={{ marginTop: 12 }}>
        <Link className="card" href="/account/listings" style={styles.card}>
          <div style={styles.title}>My Listings</div>
          <div style={styles.text}>Manage your ads, edit, mark sold.</div>
        </Link>
        <Link className="card" href="/messages" style={styles.card}>
          <div style={styles.title}>Messages</div>
          <div style={styles.text}>Your buyer/seller conversations.</div>
        </Link>
        <div className="card" style={styles.card}>
          <div style={styles.title}>Saved Searches</div>
          <div style={styles.text}>Alerts for rare finds (coming soon).</div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  card: { padding: 16, display: "block", borderRadius: 18, border: "1px solid var(--border)" },
  title: { fontWeight: 950, color: "var(--green-900)", marginBottom: 6 },
  text: { color: "var(--muted)", fontWeight: 650 },
};
