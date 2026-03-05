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

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, bio, location, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  return (
    <main className="container">
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <div>
            <h1 style={styles.h1}>{displayName}</h1>
            <p style={styles.p}>{user.email}</p>
            {profile?.location && (
              <p style={styles.location}>{profile.location}</p>
            )}
          </div>
        </div>
        <Link className="btn btn-secondary" href="/account/profile">
          Edit Profile
        </Link>
      </div>

      {profile?.bio && (
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={styles.bioLabel}>About</div>
          <div style={styles.bio}>{profile.bio}</div>
        </section>
      )}

      <div className="grid-3" style={{ marginTop: 12 }}>
        <Link className="card" href="/account/listings" style={styles.card}>
          <div style={styles.title}>My Listings</div>
          <div style={styles.text}>Manage your ads, edit, mark sold.</div>
        </Link>
        <Link className="card" href="/account/saved" style={styles.card}>
          <div style={styles.title}>Saved Listings</div>
          <div style={styles.text}>View your saved and bookmarked listings.</div>
        </Link>
        <Link className="card" href="/messages" style={styles.card}>
          <div style={styles.title}>Messages</div>
          <div style={styles.text}>Your buyer/seller conversations.</div>
        </Link>
        <Link className="card" href="/account/alerts" style={styles.card}>
          <div style={styles.title}>Search Alerts</div>
          <div style={styles.text}>Get notified when new listings match your criteria.</div>
        </Link>
        <Link className="card" href="/account/recently-viewed" style={styles.card}>
          <div style={styles.title}>Recently Viewed</div>
          <div style={styles.text}>Listings you&apos;ve looked at recently.</div>
        </Link>
        <Link className="card" href="/account/profile" style={styles.card}>
          <div style={styles.title}>Profile Settings</div>
          <div style={styles.text}>Update your display name, bio, and contact info.</div>
        </Link>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", gap: 16, alignItems: "flex-start" },
  avatar: { width: 72, height: 72, borderRadius: 18, objectFit: "cover", flexShrink: 0 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    background: "var(--soft)",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--muted)",
    flexShrink: 0,
  },
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  location: { margin: "4px 0 0", color: "var(--muted)", fontWeight: 650, fontSize: 14 },
  bioLabel: { fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 },
  bio: { color: "var(--green-900)", fontWeight: 650, lineHeight: 1.5 },
  card: { padding: 16, display: "block", borderRadius: 18, border: "1px solid var(--border)" },
  title: { fontWeight: 950, color: "var(--green-900)", marginBottom: 6 },
  text: { color: "var(--muted)", fontWeight: 650 },
};
