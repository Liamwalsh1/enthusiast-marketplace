import Link from "next/link";

const demoListings = [
  { id: "1", title: "2002 Honda S2000 AP1", price: "€29,500", location: "Dublin", type: "Car" },
  { id: "2", title: "Volk TE37 18x9.5 (5x114.3)", price: "€2,150", location: "Cork", type: "Part" },
  { id: "3", title: "Signed Nürburgring poster (limited)", price: "€180", location: "Galway", type: "Memorabilia" },
];

export default function BrowsePage() {
  return (
    <main className="container">
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.h1}>Browse</h1>
          <p style={styles.p}>Search and filter enthusiast listings. (We’ll connect real data with Supabase next.)</p>
        </div>
        <Link className="btn btn-primary" href="/sell">Post an ad</Link>
      </div>

      <section className="card" style={styles.filters}>
        <div style={styles.filtersGrid}>
          <input className="input" placeholder="Keyword (e.g. E30, 997, BBS, Bride…)" />
          <select className="select">
            <option>All categories</option>
            <option>Cars</option>
            <option>Parts</option>
            <option>Memorabilia</option>
          </select>
          <select className="select">
            <option>Any condition</option>
            <option>New</option>
            <option>Used</option>
            <option>Refurbished</option>
          </select>
          <select className="select">
            <option>Sort: Newest</option>
            <option>Price: Low → High</option>
            <option>Price: High → Low</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button className="btn btn-primary">Apply</button>
          <button className="btn btn-ghost">Reset</button>
        </div>
      </section>

      <section style={{ marginTop: 14 }} className="grid-3">
        {demoListings.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="card" style={styles.listingCard}>
            <div style={styles.badges}>
              <span className="pill">{l.type}</span>
              <span className="pill">{l.location}</span>
            </div>
            <div style={styles.title}>{l.title}</div>
            <div style={styles.price}>{l.price}</div>
            <div style={styles.meta}>Tap to view details</div>
          </Link>
        ))}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" },
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  filters: { padding: 16, marginTop: 12 },
  filtersGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  listingCard: { padding: 16, display: "grid", gap: 8 },
  badges: { display: "flex", gap: 8, flexWrap: "wrap" },
  title: { fontWeight: 900, color: "var(--green-900)" },
  price: { fontWeight: 900, fontSize: 18 },
  meta: { color: "var(--muted)", fontWeight: 650, fontSize: 13 },
};
