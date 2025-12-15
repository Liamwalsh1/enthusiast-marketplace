export default function SellPage() {
  return (
    <main className="container">
      <h1 style={styles.h1}>Post an ad</h1>
      <p style={styles.p}>
        This is the listing form UI. Next we’ll save it to Supabase and upload photos.
      </p>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <section className="card" style={styles.card}>
          <div style={styles.sectionTitle}>Listing details</div>

          <label style={styles.label}>Category</label>
          <select className="select">
            <option>Car</option>
            <option>Part</option>
            <option>Memorabilia</option>
          </select>

          <div style={styles.row}>
            <div>
              <label style={styles.label}>Title</label>
              <input className="input" placeholder="e.g. 2002 Honda S2000 AP1 (UK Import)" />
            </div>
            <div>
              <label style={styles.label}>Price</label>
              <input className="input" placeholder="e.g. 29500" />
            </div>
          </div>

          <div style={styles.row}>
            <div>
              <label style={styles.label}>Location</label>
              <input className="input" placeholder="e.g. Dublin" />
            </div>
            <div>
              <label style={styles.label}>Condition</label>
              <select className="select">
                <option>Used</option>
                <option>New</option>
                <option>Refurbished</option>
              </select>
            </div>
          </div>

          <label style={styles.label}>Description</label>
          <textarea className="textarea" placeholder="Add the details enthusiasts care about: spec, history, condition, extras…" />

          <div style={styles.actions}>
            <button className="btn btn-primary">Preview</button>
            <button className="btn btn-secondary">Save draft</button>
          </div>
        </section>

        <aside className="card" style={styles.card}>
          <div style={styles.sectionTitle}>Photos (next step)</div>
          <p style={styles.smallText}>
            We’ll add photo upload with Supabase Storage. For now, this is just the layout placeholder.
          </p>

          <div style={styles.uploadBox}>
            <div style={{ fontWeight: 850, color: "var(--green-900)" }}>Upload photos</div>
            <div style={styles.smallText}>Drag & drop or click (coming next)</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Posting tips</div>
            <ul style={styles.ul}>
              <li>Lead photo should be clean and well-lit</li>
              <li>List key spec + known faults honestly</li>
              <li>Add provenance (service history, receipts) where possible</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650, maxWidth: 780 },
  card: { padding: 16 },
  sectionTitle: { fontWeight: 950, color: "var(--green-900)", marginBottom: 10 },
  label: { display: "block", marginTop: 10, marginBottom: 6, fontWeight: 800, color: "var(--green-900)" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  uploadBox: {
    marginTop: 6,
    borderRadius: 16,
    border: "1px dashed var(--border)",
    background: "var(--soft)",
    padding: 16,
  },
  smallText: { color: "var(--muted)", fontWeight: 650, fontSize: 13, marginTop: 6 },
  ul: { margin: 10, paddingLeft: 18, color: "var(--muted)", fontWeight: 650 },
};
