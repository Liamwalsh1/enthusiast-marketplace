export default function AccountPage() {
  return (
    <main className="container">
      <h1 style={styles.h1}>Account</h1>
      <p style={styles.p}>This is a placeholder. Next we’ll connect Supabase Auth.</p>

      <div className="grid-3" style={{ marginTop: 12 }}>
        <div className="card" style={styles.card}>
          <div style={styles.title}>My Listings</div>
          <div style={styles.text}>Manage your ads, edit, mark sold.</div>
        </div>
        <div className="card" style={styles.card}>
          <div style={styles.title}>Messages</div>
          <div style={styles.text}>Your buyer/seller conversations.</div>
        </div>
        <div className="card" style={styles.card}>
          <div style={styles.title}>Saved Searches</div>
          <div style={styles.text}>Get alerts for the rare stuff.</div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  card: { padding: 16 },
  title: { fontWeight: 950, color: "var(--green-900)", marginBottom: 6 },
  text: { color: "var(--muted)", fontWeight: 650 },
};
