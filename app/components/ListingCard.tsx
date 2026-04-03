"use client";

import Link from "next/link";
import Image from "next/image";
import { type CSSProperties } from "react";
import SaveListingButton from "./SaveListingButton";

type CategoryType = "car" | "part" | "memorabilia" | "wheels";

type Listing = {
  id: string;
  title: string;
  category: CategoryType;
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  status?: string | null;
  image_urls?: string[] | null;
  blur_data_urls?: string[] | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  transmission?: string | null;
  wheel_diameter?: number | null;
  wheel_width?: number | null;
  bolt_pattern?: string | null;
  wheel_brand?: string | null;
  wheel_quantity?: number | null;
};

type Props = {
  listing: Listing;
  isLoggedIn: boolean;
  showCategory?: boolean;
  priority?: boolean;
};

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function formatMileage(km: number | null | undefined) {
  if (km === null || km === undefined) return null;
  return new Intl.NumberFormat("en-IE").format(km) + " km";
}

function labelCategory(cat: CategoryType) {
  if (cat === "car") return "Car";
  if (cat === "wheels") return "Wheels";
  if (cat === "part") return "Part";
  return "Memorabilia";
}

export default function ListingCard({ listing, isLoggedIn, showCategory = false, priority = false }: Props) {
  const isSold = listing.status === "sold";

  const blurDataUrl = listing.blur_data_urls?.[0];
  const imageUrl = listing.image_urls?.[0];

  return (
    <div className="card" style={{ ...styles.listingCard, opacity: isSold ? 0.75 : 1 }}>
      <Link href={`/listings/${listing.id}`} style={styles.cardLink}>
        {imageUrl ? (
          <div style={styles.imageWrap}>
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
              priority={priority}
              placeholder={blurDataUrl ? "blur" : "empty"}
              blurDataURL={blurDataUrl}
            />
          </div>
        ) : (
          <div style={styles.noImage}>No image</div>
        )}
        <div style={styles.cardContent}>
          <div style={styles.badges}>
            {listing.location && <span className="pill">{listing.location}</span>}
          </div>
          <div style={styles.listingTitle}>{listing.title}</div>
          {listing.category === "car" && (listing.year || listing.mileage_km || listing.transmission) && (
            <div style={styles.specsRow}>
              {listing.year && <span>{listing.year}</span>}
              {listing.mileage_km !== null && listing.mileage_km !== undefined && (
                <span>{formatMileage(listing.mileage_km)}</span>
              )}
              {listing.transmission && <span>{listing.transmission}</span>}
            </div>
          )}
          {listing.category === "wheels" && (listing.wheel_diameter || listing.wheel_brand || listing.bolt_pattern) && (
            <div style={styles.specsRow}>
              {listing.wheel_diameter && listing.wheel_width && (
                <span>{listing.wheel_diameter}&quot;x{listing.wheel_width}&quot;</span>
              )}
              {listing.bolt_pattern && <span>{listing.bolt_pattern}</span>}
              {listing.wheel_brand && <span>{listing.wheel_brand}</span>}
              {listing.wheel_quantity && <span>Qty: {listing.wheel_quantity}</span>}
            </div>
          )}
          <div style={styles.price}>{formatPrice(listing.price_eur)}</div>
        </div>
      </Link>

      {/* Save button - positioned in top right */}
      <div style={styles.saveButtonWrap} onClick={(e) => e.stopPropagation()}>
        <SaveListingButton listingId={listing.id} isLoggedIn={isLoggedIn} variant="icon" />
      </div>

      {/* Sold badge */}
      {isSold && <div style={styles.soldBadge}>SOLD</div>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  listingCard: {
    padding: 0,
    display: "grid",
    gap: 0,
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    cursor: "pointer",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
  imageWrap: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    background: "var(--soft)",
    position: "relative",
  },
  noImage: {
    width: "100%",
    height: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--soft)",
    color: "var(--muted)",
    fontWeight: 700,
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
    display: "grid",
    gap: 8,
  },
  badges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  listingTitle: {
    fontWeight: 900,
    color: "var(--green-900)",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: 1.3,
  },
  specsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 13,
    color: "var(--muted)",
    fontWeight: 650,
  },
  price: {
    fontWeight: 900,
    fontSize: 18,
    color: "var(--green-700)",
  },
  saveButtonWrap: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    background: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  soldBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    background: "rgba(220,38,38,0.9)",
    color: "#fff",
    fontWeight: 900,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    letterSpacing: 1,
    zIndex: 5,
  },
};
