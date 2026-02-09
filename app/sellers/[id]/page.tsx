import Link from "next/link";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { RatingDisplay } from "@/app/components/StarRating";
import ReviewList, { type Review } from "@/app/components/ReviewList";

export const dynamic = "force-dynamic";

type SellerProfile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
};

type SellerStats = {
  avg_rating: number | null;
  review_count: number;
};

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia" | "wheels";
  price_eur: number | null;
  status: string | null;
  image_urls: string[] | null;
};

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function labelCategory(cat: Listing["category"]) {
  if (cat === "car") return "Car";
  if (cat === "wheels") return "Wheels";
  if (cat === "part") return "Part";
  return "Memorabilia";
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sellerId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get seller profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, bio, location, created_at")
    .eq("user_id", sellerId)
    .maybeSingle();

  // Get seller stats
  let stats: SellerStats | null = null;
  const { data: statsData } = await supabase.rpc("get_seller_stats", {
    p_seller_id: sellerId,
  });
  if (statsData && statsData.length > 0) {
    stats = statsData[0];
  }

  // Get reviews
  let reviews: Review[] = [];
  const { data: reviewsData, error: reviewsError } = await supabase.rpc(
    "get_seller_reviews_with_users",
    { p_seller_id: sellerId }
  );

  if (reviewsError) {
    const { data: directReviews } = await supabase
      .from("seller_reviews")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    reviews = (directReviews ?? []) as Review[];
  } else {
    reviews = (reviewsData ?? []) as Review[];
  }

  // Get seller's active listings
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, status, image_urls")
    .eq("owner_id", sellerId)
    .in("status", ["active", "sold"])
    .order("created_at", { ascending: false })
    .limit(6);

  const sellerName = profile?.display_name || "Seller";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IE", {
        year: "numeric",
        month: "long",
      })
    : null;

  // Check if no profile and no listings - seller doesn't exist
  if (!profile && (!listings || listings.length === 0)) {
    return (
      <main className="container">
        <Link className="pill" href="/browse">
          ← Back to Browse
        </Link>
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
            Seller not found
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            This seller profile does not exist or has been removed.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <Link className="pill" href="/browse">
        ← Back to Browse
      </Link>

      <div className="grid-2" style={{ marginTop: 12 }}>
        {/* Main content */}
        <section>
          {/* Profile header */}
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 950,
                    color: "var(--green-900)",
                  }}
                >
                  {sellerName}
                </h1>
                <div style={{ marginTop: 8 }}>
                  <RatingDisplay
                    rating={stats?.avg_rating ?? null}
                    reviewCount={Number(stats?.review_count ?? 0)}
                    size={18}
                  />
                </div>
              </div>
            </div>

            {profile?.bio && (
              <div style={{ marginTop: 16 }}>
                <div style={labelStyle}>About</div>
                <div
                  style={{
                    color: "var(--text)",
                    fontWeight: 650,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {profile.bio}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {profile?.location && (
                <div>
                  <div style={labelStyle}>Location</div>
                  <div style={valueStyle}>{profile.location}</div>
                </div>
              )}
              {memberSince && (
                <div>
                  <div style={labelStyle}>Member since</div>
                  <div style={valueStyle}>{memberSince}</div>
                </div>
              )}
              <div>
                <div style={labelStyle}>Listings</div>
                <div style={valueStyle}>{listings?.length ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Reviews section */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div
              style={{
                fontWeight: 950,
                color: "var(--green-900)",
                fontSize: 20,
                marginBottom: 16,
              }}
            >
              Reviews ({stats?.review_count ?? 0})
            </div>
            <ReviewList reviews={reviews} currentUserId={user?.id ?? null} />
          </div>
        </section>

        {/* Sidebar with listings */}
        <aside style={{ display: "grid", gap: 12, alignContent: "flex-start" }}>
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontWeight: 950,
                color: "var(--green-900)",
                marginBottom: 12,
              }}
            >
              Active Listings
            </div>
            {!listings || listings.length === 0 ? (
              <div style={{ color: "var(--muted)", fontWeight: 650 }}>
                No active listings
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {(listings as Listing[]).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    style={{
                      display: "flex",
                      gap: 12,
                      textDecoration: "none",
                      color: "inherit",
                      padding: 8,
                      borderRadius: 10,
                      background: "var(--soft)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {listing.image_urls && listing.image_urls.length > 0 ? (
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          background: "var(--border)",
                          borderRadius: 8,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "var(--muted)",
                          fontWeight: 700,
                        }}
                      >
                        No img
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "var(--green-900)",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {listing.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          marginTop: 4,
                        }}
                      >
                        <span className="pill" style={{ fontSize: 10, padding: "2px 6px" }}>
                          {labelCategory(listing.category)}
                        </span>
                        {listing.status === "sold" && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "rgba(153,27,27,1)",
                            }}
                          >
                            SOLD
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "var(--green-900)",
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        {formatPrice(listing.price_eur)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {listings && listings.length > 0 && (
              <Link
                href={`/browse?seller=${sellerId}`}
                className="btn btn-secondary"
                style={{ marginTop: 12, width: "100%" }}
              >
                View all listings
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "var(--green-900)",
};
