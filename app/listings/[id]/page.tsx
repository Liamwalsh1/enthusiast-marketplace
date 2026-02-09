import Link from "next/link";
import type { Metadata } from "next";
import ImageCarousel from "@/app/components/ImageCarousel";
import MessageSellerCard from "@/app/components/MessageSellerCard";
import SellerControls from "@/app/components/SellerControls";
import CommentSection from "@/app/components/CommentSection";
import SaveListingButton from "@/app/components/SaveListingButton";
import SellerReviewsSection from "@/app/components/SellerReviewsSection";
import TrackRecentlyViewed from "@/app/components/TrackRecentlyViewed";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("title, price_eur, location, category, make, model, year, image_urls, description")
    .eq("id", id)
    .maybeSingle();

  if (!listing) {
    return {
      title: "Listing Not Found",
      description: "This listing may have been removed or is no longer available.",
    };
  }

  // Build a descriptive title
  let title = listing.title;
  if (listing.location) {
    title += ` in ${listing.location}`;
  }
  if (listing.price_eur) {
    title += ` | €${new Intl.NumberFormat("en-IE").format(listing.price_eur)}`;
  }

  // Build description
  let description = "";
  if (listing.category === "car" && listing.make) {
    description = `${listing.year || ""} ${listing.make} ${listing.model || ""} for sale`.trim();
    if (listing.location) description += ` in ${listing.location}`;
    description += ". ";
  }
  description += listing.description?.slice(0, 150) || "View details and contact the seller.";

  const imageUrl = listing.image_urls?.[0];

  return {
    title,
    description,
    openGraph: {
      title: listing.title,
      description,
      url: `${siteUrl}/listings/${id}`,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: listing.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: listing.title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia" | "wheels";
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  description: string | null;
  created_at: string;
  image_urls?: string[] | null;
  blur_data_urls?: string[] | null;
  owner_id: string | null;
  status?: string | null;
  rejection_reason?: string | null;
  // Car-specific fields
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine_cc?: number | null;
  engine_type?: string | null;
  transmission?: string | null;
  mileage_km?: number | null;
  vin?: string | null;
  // Wheel-specific fields
  wheel_diameter?: number | null;
  wheel_width?: number | null;
  bolt_pattern?: string | null;
  wheel_offset?: number | null;
  center_bore?: number | null;
  wheel_quantity?: number | null;
  wheel_brand?: string | null;
  wheel_material?: string | null;
  wheel_style?: string | null;
};

type ListingError = {
  kind: "fetch";
  status: number;
  detail: string;
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

function formatMileage(km: number | null | undefined) {
  if (km === null || km === undefined) return null;
  return new Intl.NumberFormat("en-IE").format(km) + " km";
}

function formatEngineSize(cc: number | null | undefined) {
  if (cc === null || cc === undefined) return null;
  return new Intl.NumberFormat("en-IE").format(cc) + " cc";
}

// getListing now uses the Supabase client passed in to respect RLS policies
async function getListing(
  id: string,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<{
  listing: Listing | null;
  error: ListingError | null;
}> {
  const { data, error } = await supabase
    .from("listings")
    .select("id,title,category,price_eur,location,condition,description,created_at,image_urls,blur_data_urls,owner_id,make,model,year,engine_cc,engine_type,transmission,mileage_km,vin,rejection_reason,status,wheel_diameter,wheel_width,bolt_pattern,wheel_offset,center_bore,wheel_quantity,wheel_brand,wheel_material,wheel_style")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase fetch failed:", error.message);
    return {
      listing: null,
      error: { kind: "fetch", status: 500, detail: error.message },
    };
  }

  return { listing: data as Listing | null, error: null };
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const { submitted } = await searchParams;
  const justSubmitted = submitted === "true";
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { listing, error: listingError } = await getListing(id, supabase);
  const isFetchError = listingError?.kind === "fetch";
  const fetchDetail = listingError?.kind === "fetch" ? listingError.detail : null;
  const devDetail = process.env.NODE_ENV !== "production" ? fetchDetail : null;
  const isOwner = listing && user ? listing.owner_id === user.id : false;
  const isSold = listing?.status === "sold";
  const isPending = listing?.status === "pending";
  const isRejected = listing?.status === "rejected";

  return (
    <main className="container">
      <Link className="pill" href="/browse">
        ← Back to Browse
      </Link>

      {justSubmitted && isPending && (
        <div
          className="card"
          style={{
            marginTop: 12,
            padding: 16,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <div style={{ fontWeight: 900, color: "rgba(22,101,52,1)" }}>Listing submitted!</div>
          <p style={{ color: "rgba(22,101,52,0.9)", fontWeight: 650, marginTop: 6, marginBottom: 0 }}>
            Your listing is now pending admin review. You&apos;ll be notified once it&apos;s approved and visible to buyers.
          </p>
        </div>
      )}

      {!listing ? (
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
            {isFetchError ? "Unable to load listing" : "Listing not found"}
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>
            {isFetchError
              ? "Supabase returned an error while fetching this listing."
              : "This listing may have been removed."}
          </div>
          {devDetail ? (
            <pre
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                background: "var(--soft)",
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
                fontSize: 13,
              }}
            >
              {devDetail}
            </pre>
          ) : null}
        </section>
      ) : (
        <div className="grid-2" style={{ marginTop: 12 }}>
          <section className="card" style={{ padding: 16 }}>
            {listing.image_urls?.length ? (
              <ImageCarousel
                title={listing.title}
                urls={listing.image_urls ?? []}
                blurDataUrls={listing.blur_data_urls ?? undefined}
              />

            ) : (
              <div
                style={{
                  height: 280,
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  background: "var(--soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--muted)",
                  fontWeight: 750,
                }}
              >
                No photos yet
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span className="pill">{labelCategory(listing.category)}</span>
              <span className="pill">{listing.location ?? "—"}</span>
              <span className="pill">{listing.condition ?? "—"}</span>
            </div>

            <div
              style={{
                margin: "12px 0 0",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <h1 className="listing-title">
                  {listing.title}
                </h1>
                {isSold && (
                  <span
                    className="pill"
                    style={{
                      background: "rgba(220,38,38,0.1)",
                      border: "1px solid rgba(220,38,38,0.4)",
                      color: "rgba(153,27,27,1)",
                      fontWeight: 900,
                      letterSpacing: 1,
                    }}
                  >
                    SOLD
                  </span>
                )}
                {isPending && (
                  <span
                    className="pill"
                    style={{
                      background: "rgba(234,179,8,0.1)",
                      border: "1px solid rgba(234,179,8,0.4)",
                      color: "rgba(161,98,7,1)",
                      fontWeight: 900,
                      letterSpacing: 1,
                    }}
                  >
                    PENDING REVIEW
                  </span>
                )}
                {isRejected && (
                  <span
                    className="pill"
                    style={{
                      background: "rgba(220,38,38,0.1)",
                      border: "1px solid rgba(220,38,38,0.4)",
                      color: "rgba(153,27,27,1)",
                      fontWeight: 900,
                      letterSpacing: 1,
                    }}
                  >
                    REJECTED
                  </span>
                )}
              </div>
              {!isOwner && (
                <SaveListingButton listingId={listing.id} isLoggedIn={!!user} />
              )}
            </div>

            <div className="listing-price">
              {formatPrice(listing.price_eur)}
            </div>

            {listing.category === "car" && (listing.make || listing.model || listing.year || listing.mileage_km || listing.engine_cc || listing.transmission) && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontWeight: 950,
                    color: "var(--green-900)",
                    marginBottom: 10,
                  }}
                >
                  Vehicle Specifications
                </div>
                <div className="spec-grid">
                  {listing.make && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Make</div>
                      <div style={specValueStyle}>{listing.make}</div>
                    </div>
                  )}
                  {listing.model && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Model</div>
                      <div style={specValueStyle}>{listing.model}</div>
                    </div>
                  )}
                  {listing.year && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Year</div>
                      <div style={specValueStyle}>{listing.year}</div>
                    </div>
                  )}
                  {listing.mileage_km !== null && listing.mileage_km !== undefined && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Mileage</div>
                      <div style={specValueStyle}>{formatMileage(listing.mileage_km)}</div>
                    </div>
                  )}
                  {listing.engine_cc && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Engine</div>
                      <div style={specValueStyle}>
                        {formatEngineSize(listing.engine_cc)}
                        {listing.engine_type ? ` ${listing.engine_type}` : ""}
                      </div>
                    </div>
                  )}
                  {listing.transmission && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Transmission</div>
                      <div style={specValueStyle}>{listing.transmission}</div>
                    </div>
                  )}
                  {listing.vin && (
                    <div style={{ ...specItemStyle, gridColumn: "1 / -1" }}>
                      <div style={specLabelStyle}>VIN</div>
                      <div style={{ ...specValueStyle, fontFamily: "monospace", fontSize: 13 }}>{listing.vin}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {listing.category === "wheels" && (listing.wheel_diameter || listing.wheel_width || listing.bolt_pattern || listing.wheel_brand || listing.wheel_quantity) && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontWeight: 950,
                    color: "var(--green-900)",
                    marginBottom: 10,
                  }}
                >
                  Wheel Specifications
                </div>
                <div className="spec-grid">
                  {listing.wheel_brand && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Brand</div>
                      <div style={specValueStyle}>{listing.wheel_brand}</div>
                    </div>
                  )}
                  {listing.wheel_style && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Style</div>
                      <div style={specValueStyle}>{listing.wheel_style}</div>
                    </div>
                  )}
                  {(listing.wheel_diameter || listing.wheel_width) && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Size</div>
                      <div style={specValueStyle}>
                        {listing.wheel_diameter}&quot; x {listing.wheel_width}&quot;
                      </div>
                    </div>
                  )}
                  {listing.bolt_pattern && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Bolt Pattern</div>
                      <div style={specValueStyle}>{listing.bolt_pattern}</div>
                    </div>
                  )}
                  {listing.wheel_offset !== null && listing.wheel_offset !== undefined && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Offset (ET)</div>
                      <div style={specValueStyle}>{listing.wheel_offset > 0 ? `+${listing.wheel_offset}` : listing.wheel_offset}</div>
                    </div>
                  )}
                  {listing.center_bore && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Center Bore</div>
                      <div style={specValueStyle}>{listing.center_bore} mm</div>
                    </div>
                  )}
                  {listing.wheel_quantity && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Quantity</div>
                      <div style={specValueStyle}>{listing.wheel_quantity}</div>
                    </div>
                  )}
                  {listing.wheel_material && (
                    <div style={specItemStyle}>
                      <div style={specLabelStyle}>Material</div>
                      <div style={specValueStyle}>{listing.wheel_material}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontWeight: 950,
                  color: "var(--green-900)",
                  marginBottom: 8,
                }}
              >
                Description
              </div>
              <div
                style={{
                  color: "var(--text)",
                  fontWeight: 650,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
              >
                {listing.description?.trim()
                  ? listing.description
                  : "No description provided yet."}
              </div>
            </div>
          </section>

          <aside style={{ display: "grid", gap: 12, alignContent: "flex-start" }}>
            {isOwner && isPending && (
              <div
                className="card"
                style={{
                  padding: 16,
                  background: "rgba(234,179,8,0.1)",
                  border: "1px solid rgba(234,179,8,0.4)",
                }}
              >
                <div style={{ fontWeight: 900, color: "rgba(161,98,7,1)" }}>Pending Review</div>
                <p style={{ color: "rgba(161,98,7,0.9)", fontWeight: 650, marginTop: 6, marginBottom: 0 }}>
                  Your listing is awaiting admin approval. It will not appear in search results until approved.
                </p>
              </div>
            )}
            {isOwner && isRejected && (
              <div
                className="card"
                style={{
                  padding: 16,
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.3)",
                }}
              >
                <div style={{ fontWeight: 900, color: "rgba(153,27,27,1)" }}>Listing Rejected</div>
                <p style={{ color: "rgba(153,27,27,0.9)", fontWeight: 650, marginTop: 6, marginBottom: 0 }}>
                  Your listing was not approved. Please edit and resubmit.
                </p>
                {listing.rejection_reason && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: "rgba(255,255,255,0.5)",
                      borderRadius: 8,
                      border: "1px solid rgba(220,38,38,0.2)",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(153,27,27,0.7)", textTransform: "uppercase", marginBottom: 4 }}>
                      Reason
                    </div>
                    <div style={{ color: "rgba(153,27,27,1)", fontWeight: 650 }}>
                      {listing.rejection_reason}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isOwner ? (
              <SellerControls listingId={listing.id} status={listing.status ?? null} />
            ) : isSold ? (
              <div className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
                  This item has been marked as sold. Messaging is disabled.
                </div>
              </div>
            ) : (
              <MessageSellerCard listingId={listing.id} listingTitle={listing.title} sellerId={listing.owner_id ?? null} />
            )}
            {!isOwner && process.env.NODE_ENV !== "production" ? (
              <div className="card" style={{ padding: 12, border: "1px dashed var(--border)", color: "var(--muted)" }}>
                <div style={{ fontWeight: 900, color: "var(--green-900)" }}>Owner debug</div>
                <div>listingId: {listing.id}</div>
                <div>ownerId: {listing.owner_id ?? "null"}</div>
                <div>userId: {user?.id ?? "null"}</div>
              </div>
            ) : null}
            <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, color: "var(--green-900)" }}>Keep browsing</div>
              <div style={{ color: "var(--muted)", fontWeight: 650 }}>Find more in the marketplace.</div>
              <Link className="btn btn-secondary" href="/browse">
                Browse listings
              </Link>
            </div>
          </aside>
        </div>
      )}

      {listing && listing.owner_id && (
        <SellerReviewsSection
          sellerId={listing.owner_id}
          listingId={listing.id}
          listingTitle={listing.title}
        />
      )}

      {listing && (
        <CommentSection listingId={listing.id} sellerId={listing.owner_id} />
      )}

      {listing && (
        <TrackRecentlyViewed
          id={listing.id}
          title={listing.title}
          price_eur={listing.price_eur}
          image_url={listing.image_urls?.[0] ?? null}
          category={listing.category}
        />
      )}
    </main>
  );
}

const specItemStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  background: "var(--soft)",
  border: "1px solid var(--border)",
};

const specLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const specValueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "var(--green-900)",
  marginTop: 2,
};
