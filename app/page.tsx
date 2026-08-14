import Link from "next/link";
import SearchBox from "./components/SearchBox";
import EditorsChoiceCard from "./components/EditorsChoiceCard";
import ExploreSection from "./components/ExploreSection";
import WaitlistSection from "./components/WaitlistSection";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch editor's choice listing
  const { data: editorsChoiceData } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, location, description, image_urls, blur_data_urls, make, model, year, mileage_km, transmission")
    .eq("editors_choice", true)
    .eq("status", "active")
    .maybeSingle();

  const editorsChoice = editorsChoiceData ?? null;


  return (
    <main className="container">
      <section style={styles.hero} className="card">
        <h1 className="hero-title">Ireland's marketplace for enthusiast cars, parts & memorabilia.</h1>
        <p style={styles.p}>
          Trusted listings for collectors, builders and petrolheads.
        </p>

        <div style={styles.actions}>
          <Link className="btn btn-primary" href="/browse">Browse listings</Link>
          <Link className="btn btn-secondary" href="/sell">Post an ad</Link>
        </div>

        <SearchBox variant="home" />
      </section>

      {/* Trust signals */}
      <section style={styles.trustBar} className="trust-bar">
        <div style={styles.trustItem} className="trust-bar-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.trustIcon}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <span>Verified listings</span>
        </div>
        <div style={styles.trustDivider} className="trust-bar-divider" />
        <div style={styles.trustItem} className="trust-bar-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.trustIcon}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Ireland-based</span>
        </div>
        <div style={styles.trustDivider} className="trust-bar-divider" />
        <div style={styles.trustItem} className="trust-bar-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.trustIcon}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Secure messaging</span>
        </div>
      </section>

      {editorsChoice && (
        <section>
          <h2 style={styles.sectionTitle} className="section-title">Editor&apos;s Choice</h2>
          <EditorsChoiceCard listing={editorsChoice} />
        </section>
      )}


      <section>
        <h2 style={styles.sectionTitle} className="section-title">Explore</h2>
        <ExploreSection isLoggedIn={isLoggedIn} />
      </section>

      <WaitlistSection />

      <section>
        <h2 style={styles.sectionTitle} className="section-title">Browse by Category</h2>
        <div className="category-grid">
          <Link href="/cars" className="card category-card">
            <div className="category-icon" style={{ background: "none", width: "auto", height: "auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/car-logo.png"
                alt="Cars"
                width={192}
                height={77}
                style={{ objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </div>
            <div className="category-label">Cars</div>
            <div className="category-desc">Enthusiast vehicles</div>
          </Link>
          <Link href="/wheels" className="card category-card">
            <div className="category-icon" style={{ background: "none", width: "auto", height: "auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wheel-logo.png"
                alt="Wheels"
                width={77}
                height={77}
                style={{ objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </div>
            <div className="category-label">Wheels</div>
            <div className="category-desc">Rims, tyres & sets</div>
          </Link>
          <Link href="/parts" className="card category-card">
            <div className="category-icon" style={{ background: "none", width: "auto", height: "auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/parts-logo.png"
                alt="Parts"
                width={62}
                height={77}
                style={{ objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </div>
            <div className="category-label">Parts</div>
            <div className="category-desc">Engine, body & interior</div>
          </Link>
          <Link href="/memorabilia" className="card category-card">
            <div className="category-icon" style={{ background: "none", width: "auto", height: "auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/memorabilia-logo.png"
                alt="Memorabilia"
                width={62}
                height={77}
                style={{ objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </div>
            <div className="category-label">Memorabilia</div>
            <div className="category-desc">Signs, models & collectibles</div>
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: { padding: 22 },
  p: { marginTop: 12, marginBottom: 16, color: "var(--muted)", maxWidth: 760, fontWeight: 650 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "var(--green-900)",
    margin: "24px 0 12px",
  },
  trustBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 0,
    padding: "14px 20px",
    background: "var(--soft)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 20px",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--green-900)",
  },
  trustIcon: {
    color: "var(--green-700)",
    flexShrink: 0,
  },
  trustDivider: {
    width: 1,
    height: 20,
    background: "var(--border)",
    flexShrink: 0,
  },
};
