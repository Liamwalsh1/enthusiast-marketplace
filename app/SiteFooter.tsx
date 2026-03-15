import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={styles.wrap}>
      <div className="container" style={styles.inner}>
        <div style={styles.main}>
          <div style={styles.left}>
            <div style={styles.brand}>Passion Driven</div>
            <div style={styles.muted}>
              Ireland&apos;s home for enthusiast cars, parts, and automotive memorabilia.
            </div>
          </div>
          <div style={styles.links}>
            <div style={styles.linkGroup}>
              <div style={styles.linkHeading}>Browse</div>
              <Link href="/browse" style={styles.link}>All Listings</Link>
              <Link href="/browse?category=car" style={styles.link}>Cars</Link>
              <Link href="/browse?category=part" style={styles.link}>Parts</Link>
            </div>
            <div style={styles.linkGroup}>
              <div style={styles.linkHeading}>Account</div>
              <Link href="/sell" style={styles.link}>Sell an Item</Link>
              <Link href="/account" style={styles.link}>My Account</Link>
              <Link href="/messages" style={styles.link}>Messages</Link>
            </div>
            <div style={styles.linkGroup}>
              <div style={styles.linkHeading}>Legal</div>
              <Link href="/terms" style={styles.link}>Terms of Service</Link>
              <Link href="/privacy" style={styles.link}>Privacy Policy</Link>
              <Link href="/cookies" style={styles.link}>Cookie Policy</Link>
            </div>
            <div style={styles.linkGroup}>
              <div style={styles.linkHeading}>Contact</div>
              <a href="mailto:info@passiondriven.ie" style={styles.link}>info@passiondriven.ie</a>
            </div>
          </div>
        </div>
        <div style={styles.bottom}>
          <div style={styles.copyright}>
            © {new Date().getFullYear()} Passion Driven. All rights reserved.
          </div>
          <div style={styles.bottomLinks}>
            <Link href="/terms" style={styles.bottomLink}>Terms</Link>
            <span style={styles.sep}>|</span>
            <Link href="/privacy" style={styles.bottomLink}>Privacy</Link>
            <span style={styles.sep}>|</span>
            <Link href="/cookies" style={styles.bottomLink}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: "var(--green-900)",
    color: "white",
    marginTop: 40,
    padding: "40px 0 24px",
  },
  inner: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  main: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 32,
  },
  left: {
    display: "grid",
    gap: 8,
    maxWidth: 280,
  },
  brand: {
    fontWeight: 900,
    fontSize: 16,
  },
  muted: {
    opacity: 0.75,
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.5,
  },
  links: {
    display: "flex",
    gap: 48,
    flexWrap: "wrap",
  },
  linkGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  linkHeading: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.9,
    marginBottom: 4,
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    opacity: 0.75,
  },
  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.15)",
    paddingTop: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  copyright: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.7,
  },
  bottomLinks: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  bottomLink: {
    color: "white",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.7,
  },
  sep: {
    opacity: 0.4,
  },
};
