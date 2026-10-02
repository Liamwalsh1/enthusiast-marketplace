"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage_km: number | null;
  transmission: string | null;
  condition: string | null;
  location: string | null;
  seller_notes: string | null;
  image_urls: string[] | null;
  created_at: string;
};

export default function DescriptionsClient({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  async function handleSubmit(listingId: string) {
    const description = descriptions[listingId]?.trim();
    if (!description) return;

    setSubmitting(listingId);
    try {
      const res = await fetch("/api/admin/write-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, description }),
      });

      if (res.ok) {
        setDone((prev) => new Set([...prev, listingId]));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(null);
    }
  }

  const pending = listings.filter((l) => !done.has(l.id));

  if (pending.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 18 }}>All done!</div>
        <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
          All descriptions have been written. Sellers have been notified.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {pending.map((listing) => (
        <article key={listing.id} className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {listing.image_urls?.[0] && (
              <img
                src={listing.image_urls[0]}
                alt={listing.title}
                style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={`/listings/${listing.id}`}
                target="_blank"
                style={{ fontWeight: 900, fontSize: 17, color: "var(--green-900)", textDecoration: "none" }}
              >
                {listing.title} ↗
              </Link>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {listing.year && <Chip>{listing.year}</Chip>}
                {listing.make && <Chip>{listing.make}</Chip>}
                {listing.model && <Chip>{listing.model}</Chip>}
                {listing.transmission && <Chip>{listing.transmission}</Chip>}
                {listing.mileage_km != null && (
                  <Chip>{new Intl.NumberFormat("en-IE").format(listing.mileage_km)} km</Chip>
                )}
                {listing.condition && <Chip>{listing.condition}</Chip>}
                {listing.location && <Chip>📍 {listing.location}</Chip>}
              </div>
            </div>
          </div>

          {listing.seller_notes && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(20,83,45,0.06)",
              border: "1px solid rgba(20,83,45,0.12)",
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--green-900)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
                Seller Notes
              </div>
              <div style={{ fontSize: 14, fontWeight: 650, color: "var(--text)", lineHeight: 1.5 }}>
                {listing.seller_notes}
              </div>
            </div>
          )}

          <textarea
            className="textarea"
            placeholder="Write the listing description here…"
            value={descriptions[listing.id] ?? ""}
            onChange={(e) => setDescriptions((prev) => ({ ...prev, [listing.id]: e.target.value }))}
            style={{ minHeight: 160, marginBottom: 12 }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 650 }}>
              {(descriptions[listing.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit(listing.id)}
              disabled={submitting === listing.id || !(descriptions[listing.id] ?? "").trim()}
            >
              {submitting === listing.id ? "Publishing…" : "Publish & notify seller"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: 999,
      background: "var(--soft)",
      border: "1px solid var(--border)",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--green-900)",
    }}>
      {children}
    </span>
  );
}
