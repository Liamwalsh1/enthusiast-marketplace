import Link from "next/link";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "./lib/supabase/server";
import AuthStatus from "./components/AuthStatus";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/browse", label: "Browse" },
  { href: "/sell", label: "Sell" },
];

export default async function SiteHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header style={styles.wrap}>
      <div className="container" style={styles.inner}>
        <Link href="/" style={styles.brand}>
          <span style={styles.logo}>EM</span>
          <span>
            <div style={styles.title}>Passion Driven</div>
            <div style={styles.subtitle}>Cars • Parts • Memorabilia</div>
          </span>
        </Link>

        <nav style={styles.nav}>
          {nav.map((i) => (
            <Link key={i.href} href={i.href} style={styles.navLink}>
              {i.label}
            </Link>
          ))}
          <AuthStatus initialUserEmail={user?.email ?? null} />
        </nav>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.86)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid var(--border)",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "var(--soft)",
    border: "1px solid var(--border)",
    color: "var(--green-900)",
    fontWeight: 900,
  },
  title: { fontWeight: 900, lineHeight: 1.1 },
  subtitle: { color: "var(--muted)", fontSize: 13, fontWeight: 650 },
  nav: { display: "flex", alignItems: "center", gap: 12 },
  navLink: {
    padding: "10px 10px",
    borderRadius: 12,
    fontWeight: 750,
    color: "var(--green-900)",
  },
};
