import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="container">
      <div className="card" style={styles.card}>
        <h1 style={styles.h1}>Sign in</h1>
        <p style={styles.p}>We’ll wire this up to Supabase Auth next.</p>

        <label style={styles.label}>Email</label>
        <input className="input" placeholder="you@example.com" />

        <label style={styles.label}>Password</label>
        <input className="input" type="password" placeholder="••••••••" />

        <div style={styles.actions}>
          <button className="btn btn-primary">Sign in</button>
          <Link className="btn btn-secondary" href="/account">Continue as demo</Link>
        </div>

        <div style={styles.footerNote}>
          No account yet? <span style={{ fontWeight: 850 }}>We’ll add sign-up next.</span>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { padding: 18, maxWidth: 520, margin: "0 auto" },
  h1: { margin: 0, fontSize: 30, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  label: { display: "block", marginTop: 12, marginBottom: 6, fontWeight: 800, color: "var(--green-900)" },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  footerNote: { marginTop: 12, color: "var(--muted)", fontWeight: 650, fontSize: 13 },
};
