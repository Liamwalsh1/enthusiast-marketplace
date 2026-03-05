import Link from "next/link";
import SearchBox from "./components/SearchBox";
import ListingCard from "./components/ListingCard";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // Check if user is logged in (for save button on listing cards)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

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
        <div style={styles.heroTop}>
          <span className="pill">Passion Driven</span>
        </div>

        <h1 className="hero-title">Buy and sell enthusiast cars, parts, and memorabilia.</h1>
        <p style={styles.p}>
          Ireland's home for everything from pristine japanese sports cars to project-worthy european sedans.
        </p>

        <div style={styles.actions}>
          <Link className="btn btn-primary" href="/browse">Browse listings</Link>
          <Link className="btn btn-secondary" href="/sell">Post an ad</Link>
        </div>

        <SearchBox variant="home" />
      </section>

      {featuredListings.length > 0 && (
        <section>
          <h2 style={styles.sectionTitle}>Featured Listings</h2>
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
        <h2 style={styles.sectionTitle}>Browse by Category</h2>
        <div className="category-grid">
          <Link href="/cars" className="card category-card">
            <div className="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17h14v-5H5v5z" />
                <path d="M2 17h1m18 0h1" />
                <path d="M6 17v2m12-2v2" />
                <path d="M19 12l-2-5H7L5 12" />
                <circle cx="7.5" cy="17" r="1" />
                <circle cx="16.5" cy="17" r="1" />
              </svg>
            </div>
            <div className="category-label">Cars</div>
            <div className="category-desc">Enthusiast vehicles</div>
          </Link>
          <Link href="/wheels" className="card category-card">
            <div className="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
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
  heroTop: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  p: { marginTop: 12, marginBottom: 16, color: "var(--muted)", maxWidth: 760, fontWeight: 650 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "var(--green-900)",
    margin: "24px 0 12px",
  },
};
