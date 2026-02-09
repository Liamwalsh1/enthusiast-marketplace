"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  listing: {
    id: string;
    title: string;
    category: string;
    price_eur: number | null;
    location: string | null;
    created_at: string;
    image_url: string | null;
    owner_name: string;
  };
};

export default function AdminListingCard({ listing }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to approve listing");
        return;
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to reject listing");
        return;
      }
      setShowRejectModal(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  const priceStr = listing.price_eur
    ? `€${listing.price_eur.toLocaleString("en-IE")}`
    : "Price on request";

  return (
    <>
      <div className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 16, alignItems: "center" }}>
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <div style={{ width: 120, height: 80, background: "var(--soft)", borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 12, fontWeight: 650 }}>
            No image
          </div>
        )}

        <div>
          <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 18 }}>{listing.title}</div>
          <div style={{ color: "var(--muted)", fontWeight: 650, marginTop: 4 }}>
            {listing.category} • {priceStr} • {listing.location ?? "Location not set"}
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650, marginTop: 4, fontSize: 13 }}>
            Seller: {listing.owner_name} • Submitted {new Date(listing.created_at).toLocaleDateString("en-IE")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <Link className="btn btn-secondary" href={`/listings/${listing.id}`} target="_blank">
            View
          </Link>
          <button
            className="btn btn-primary"
            onClick={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Approve"}
          </button>
          <button
            className="btn"
            style={{ background: "#dc2626", color: "white" }}
            onClick={() => setShowRejectModal(true)}
            disabled={isLoading}
          >
            Reject
          </button>
        </div>
      </div>

      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="card"
            style={{ padding: 24, maxWidth: 400, width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 20, marginBottom: 16 }}>
              Reject Listing
            </div>
            <p style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 12 }}>
              Please provide a reason for rejection. This will be shown to the seller.
            </p>
            <textarea
              className="textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Missing vehicle details, unclear photos..."
              rows={3}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "white" }}
                onClick={handleReject}
                disabled={isLoading}
              >
                {isLoading ? "Rejecting..." : "Reject Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
