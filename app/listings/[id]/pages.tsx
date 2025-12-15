import Link from "next/link";

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const id = params.id;

  return (
    <main className="container">
      <Link className="pill" href="/browse">← Back to Browse</Link>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <section className="card" style={styles.card}>
          <div style={styles.photoBox}>Photo gallery placeholder</div>

          <h1 style={styles.h1}>Listing #{id}</h1>
          <p style={styles.p}>
            This is the listing detail layout. Later we’ll load real listing data from Supabase.
          </p>

          <div style={styles.specGrid}>
            <div className="card" style={styles.specCard}>
              <div style={styles.specLabel}>Category</div>
              <div style={styles.specValue}>Car / Part / Memorabilia</div>
            </div>
            <div className="card" style={styles.specCard}>
              <div style={styles.specLabel}>Location</div>
              <div style={styles.specValue}>Ireland</div>
            </div>
            <div className="card" style={styles.specCard}>
              <div style={styles.specLabel}>Condition</div>
              <div style={styles.specValue}>Used</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Description</div>
            <div style={styles.desc}>
              Add the story, the spec, the history, what’s included, what’s not. Enthusiasts care.
            </div>
          </div>
        </section>

        <aside className="card" style={styles.card}>
          <div style={styles.price}>€—</div>
          <div style={styles.small}>Seller: (coming with auth)</div>

          <div style={styles.actions}>
            <button className="btn btn-primary">Message seller</button>
            <button className="btn btn-secondary">Make offer</button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Safety</div>
            <ul style={styles.ul}>
              <li>Meet in a safe place</li>
              <li>Verify receipts / VIN where relevant</li>
              <li>Use on-platform messaging (we’ll add next)</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { padding: 16 },
  photoBox: {
    height: 280,
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--soft)",
    display: "grid",
    placeItems: "center",
    color: "var(--muted)",
    fontWeight: 750,
  },
  h1: { margin: "14px 0 0", fontSize: 32, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  specGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 },
  specCard: { padding: 12, boxShadow: "none" },
  specLabel: { fontSize: 12, color: "var(--muted)", fontWeight: 800 },
  specValue: { fontWeight: 900, color: "var(--green-900)" },
  sectionTitle: { fontWeight: 950, color: "var(--green-900)", marginBottom: 8 },
  desc: { color: "var(--text)", fontWeight: 650, lineHeight: 1.5 },
  price: { fontSize: 28, fontWeight: 950, color: "var(--green-900)" },
  small: { color: "var(--muted)", fontWeight: 650, marginTop: 6 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  ul: { margin: 10, paddingLeft: 18, color: "var(--muted)", fontWeight: 650 },
};
