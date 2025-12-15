export default function SiteFooter() {
  return (
    <footer style={styles.wrap}>
      <div className="container" style={styles.inner}>
        <div style={styles.left}>
          <div style={styles.brand}>Enthusiast Marketplace</div>
          <div style={styles.muted}>
            Built for car people. Quality listings over endless scrolling.
          </div>
        </div>
        <div style={styles.right}>
          <span className="pill">© {new Date().getFullYear()}</span>
          <span className="pill">Ireland-first (expand later)</span>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderTop: "1px solid var(--border)",
    marginTop: 28,
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  left: { display: "grid", gap: 6 },
  brand: { fontWeight: 900, color: "var(--green-900)" },
  muted: { color: "var(--muted)", fontWeight: 650, fontSize: 13 },
  right: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
};
