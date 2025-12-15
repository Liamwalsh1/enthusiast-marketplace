import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <section style={styles.hero} className="card">
        <div style={styles.heroTop}>
          <span className="pill">Enthusiast-first marketplace</span>
          <span className="pill">No junk • No clutter</span>
        </div>

        <h1 style={styles.h1}>Buy and sell enthusiast cars, parts, and memorabilia.</h1>
        <p style={styles.p}>
          Built for people who care about spec sheets, provenance, and condition. Start with Ireland, expand from there.
        </p>

        <div style={styles.actions}>
          <Link className="btn btn-primary" href="/browse">Browse listings</Link>
          <Link className="btn btn-secondary" href="/sell">Post an ad</Link>
        </div>

        <div style={styles.searchRow}>
          <input className="input" placeholder="Search (e.g. E46 M3, TE37, Recaro, 996, SR20)…" />
          <Link className="btn btn-primary" href="/browse">Search</Link>
        </div>
      </section>

      <section style={{ marginTop: 16 }} className="grid-3">
        <div className="card" style={styles.smallCard}>
          <div style={styles.cardTitle}>Cars</div>
          <div style={styles.cardText}>Detailed listings that respect enthusiast context.</div>
        </div>
        <div className="card" style={styles.smallCard}>
          <div style={styles.cardTitle}>Parts</div>
          <div style={styles.cardText}>OEM + aftermarket, with compatibility-friendly structure later.</div>
        </div>
        <div className="card" style={styles.smallCard}>
          <div style={styles.cardTitle}>Memorabilia</div>
          <div style={styles.cardText}>Collectibles with authenticity and provenance in mind.</div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: { padding: 22 },
  heroTop: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  h1: { margin: "8px 0 0", fontSize: 44, lineHeight: 1.06, fontWeight: 950, color: "var(--green-900)" },
  p: { marginTop: 12, marginBottom: 16, color: "var(--muted)", maxWidth: 760, fontWeight: 650 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  searchRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  smallCard: { padding: 16 },
  cardTitle: { fontWeight: 900, color: "var(--green-900)", marginBottom: 6 },
  cardText: { color: "var(--muted)", fontWeight: 650 },
};
