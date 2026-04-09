import Link from "next/link";
import SearchBox from "./components/SearchBox";
import ListingCard from "./components/ListingCard";
import EditorsChoiceCard from "./components/EditorsChoiceCard";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // Check if user is logged in (for save button on listing cards)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch editor's choice listing
  const { data: editorsChoiceData } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, location, description, image_urls, blur_data_urls, make, model, year, mileage_km, transmission")
    .eq("editors_choice", true)
    .eq("status", "active")
    .maybeSingle();

  const editorsChoice = editorsChoiceData ?? null;

  // Fetch featured listings (both admin-featured and paid-featured)
  const { data: featured } = await supabase
    .from("listings")
    .select(
      "id, title, category, price_eur, location, condition, status, image_urls, blur_data_urls, make, model, year, mileage_km, transmission, wheel_diameter, wheel_width, bolt_pattern, wheel_brand, wheel_quantity, is_featured, featured_until"
    )
    .eq("status", "active")
    .or(`is_featured.eq.true,featured_until.gt.${new Date().toISOString()}`)
    .order("featured_at", { ascending: false, nullsFirst: false })
    .limit(4);

  const featuredListings = featured ?? [];

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
        <div style={styles.trustDivider} className="trust-bar-divider" />
        <div style={styles.trustItem} className="trust-bar-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.trustIcon}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Enthusiast specialists</span>
        </div>
      </section>

      {editorsChoice && (
        <section>
          <h2 style={styles.sectionTitle} className="section-title">Editor&apos;s Choice</h2>
          <EditorsChoiceCard listing={editorsChoice} />
        </section>
      )}

      {featuredListings.length > 0 && (
        <section>
          <h2 style={styles.sectionTitle} className="section-title">Featured Listings</h2>
          <div className="grid-4">
            {featuredListings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isLoggedIn={isLoggedIn}
                showCategory
                priority={index < 4}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 style={styles.sectionTitle} className="section-title">Browse by Category</h2>
        <div className="category-grid">
          <Link href="/cars" className="card category-card">
            <div className="category-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/car-logo.png"
                alt="Cars"
                width={52}
                height={34}
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="category-label">Cars</div>
            <div className="category-desc">Enthusiast vehicles</div>
          </Link>
          <Link href="/wheels" className="card category-card">
            <div className="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Outer tyre */}
                <circle cx="12" cy="12" r="10" />
                {/* Hub ring */}
                <circle cx="12" cy="12" r="2.5" />
                {/* 5 spokes radiating from hub to rim */}
                <line x1="12" y1="9.5" x2="12" y2="2" />
                <line x1="14.4" y1="10.8" x2="21.5" y2="8.9" />
                <line x1="13.5" y1="14" x2="17.9" y2="20.1" />
                <line x1="10.5" y1="14" x2="6.1" y2="20.1" />
                <line x1="9.6" y1="10.8" x2="2.5" y2="8.9" />
              </svg>
            </div>
            <div className="category-label">Wheels</div>
            <div className="category-desc">Rims, tyres & sets</div>
          </Link>
          <Link href="/parts" className="card category-card">
            <div className="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div className="category-label">Parts</div>
            <div className="category-desc">Engine, body & interior</div>
          </Link>
          <Link href="/memorabilia" className="card category-card">
            <div className="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
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
