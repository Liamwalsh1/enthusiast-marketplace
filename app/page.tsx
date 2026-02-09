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

  // Fetch featured listings
  const { data: featured } = await supabase
    .from("listings")
    .select(
      "id, title, category, price_eur, location, condition, status, image_urls, blur_data_urls, make, model, year, mileage_km, transmission, wheel_diameter, wheel_width, bolt_pattern, wheel_brand, wheel_quantity"
    )
    .eq("is_featured", true)
    .eq("status", "active")
    .order("featured_at", { ascending: false })
    .limit(4);

  const featuredListings = featured ?? [];

  return (
    <main className="container">
      <section style={styles.hero} className="card">
        <div style={styles.heroTop}>
          <span className="pill">Passion Driven</span>
          <span className="pill">No junk • No clutter</span>
        </div>

        <h1 className="hero-title">Buy and sell classic cars, parts, and memorabilia.</h1>
        <p style={styles.p}>
          Built for people who care about spec sheets, provenance, and condition. Start with Ireland, expand from there.
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
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isLoggedIn={isLoggedIn}
                showCategory
              />
            ))}
          </div>
        </section>
      )}

      <section className="category-grid">
        <Link href="/cars" className="card category-card">
          Cars
        </Link>
        <Link href="/wheels" className="card category-card">
          Wheels
        </Link>
        <Link href="/parts" className="card category-card">
          Parts
        </Link>
        <Link href="/memorabilia" className="card category-card">
          Memorabilia
        </Link>
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
