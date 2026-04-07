import Link from "next/link";
import Image from "next/image";

type Listing = {
  id: string;
  title: string;
  price_eur: number | null;
  location: string | null;
  description: string | null;
  image_urls: string[] | null;
  blur_data_urls: string[] | null;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage_km: number | null;
  transmission: string | null;
  category: string;
};

function formatPrice(price: number | null) {
  if (!price) return "POA";
  return "€" + new Intl.NumberFormat("en-IE").format(price);
}

export default function EditorsChoiceCard({ listing }: { listing: Listing }) {
  const image = listing.image_urls?.[0];
  const blurUrl = listing.blur_data_urls?.[0];
  const snippet = listing.description?.slice(0, 180).trim();

  return (
    <Link href={`/listings/${listing.id}`} style={cardStyle}>
      <div style={imageWrapStyle}>
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            placeholder={blurUrl ? "blur" : "empty"}
            blurDataURL={blurUrl ?? undefined}
            priority
          />
        ) : (
          <div style={imageFallbackStyle}>No photo</div>
        )}
        <div style={badgeStyle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Editor&apos;s Choice
        </div>
      </div>
      <div style={contentStyle}>
        <div style={titleStyle}>{listing.title}</div>
        <div style={priceStyle}>{formatPrice(listing.price_eur)}</div>
        {(listing.year || listing.mileage_km || listing.transmission) && (
          <div style={specsStyle}>
            {listing.year && <span style={specChipStyle}>{listing.year}</span>}
            {listing.mileage_km && (
              <span style={specChipStyle}>
                {new Intl.NumberFormat("en-IE").format(listing.mileage_km)} km
              </span>
            )}
            {listing.transmission && <span style={specChipStyle}>{listing.transmission}</span>}
          </div>
        )}
        {snippet && <p style={snippetStyle}>{snippet}{(listing.description?.length ?? 0) > 180 ? "…" : ""}</p>}
        <div style={metaStyle}>
          {listing.location && <span style={locationStyle}>{listing.location}</span>}
          <span style={ctaStyle}>
            View listing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

const cardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  borderRadius: 20,
  overflow: "hidden",
  border: "2px solid var(--green-900)",
  background: "white",
  textDecoration: "none",
  color: "inherit",
  transition: "box-shadow 0.2s",
};

const imageWrapStyle: React.CSSProperties = {
  position: "relative",
  minHeight: 280,
  background: "var(--soft)",
};

const imageFallbackStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  color: "var(--muted)",
  fontWeight: 700,
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  left: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: "var(--green-900)",
  color: "white",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.5,
  padding: "5px 10px",
  borderRadius: 20,
  zIndex: 1,
};

const contentStyle: React.CSSProperties = {
  padding: "28px 28px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  justifyContent: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
  color: "var(--green-900)",
  lineHeight: 1.25,
};

const priceStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: "var(--green-700, var(--green-900))",
};

const specsStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const specChipStyle: React.CSSProperties = {
  background: "var(--soft)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: "3px 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text)",
};

const snippetStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--muted)",
  lineHeight: 1.55,
  margin: 0,
};

const metaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 4,
};

const locationStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--muted)",
};

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 13,
  fontWeight: 800,
  color: "var(--green-900)",
};
