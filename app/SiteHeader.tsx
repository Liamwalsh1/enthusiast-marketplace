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
      <div className="container site-header-inner">
        <Link href="/" style={styles.brand}>
          <span style={styles.logo}>PD</span>
          <span className="brand-text">
            <div style={styles.title}>Passion Driven</div>
            <div style={styles.subtitle}>Cars • Parts • Memorabilia</div>
          </span>
        </Link>

        <nav className="site-nav">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} className="nav-link" style={styles.navLink}>
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
    flexShrink: 0,
  },
  title: { fontWeight: 900, lineHeight: 1.1 },
  subtitle: { color: "var(--muted)", fontSize: 13, fontWeight: 650 },
  navLink: {
    padding: "10px 10px",
    borderRadius: 12,
    fontWeight: 750,
    color: "var(--green-900)",
  },
};
