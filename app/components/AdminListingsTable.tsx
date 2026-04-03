"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Listing = {
  id: string;
  title: string;
  category: string;
  price_eur: number | null;
  location: string | null;
  status: string;
  created_at: string;
  owner_id: string;
  is_featured: boolean;
};

type Props = {
  listings: Listing[];
  profileMap: Map<string, string>;
};

export default function AdminListingsTable({ listings, profileMap }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const allSelected = listings.length > 0 && selected.size === listings.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listings.map((l) => l.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} listing${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/listings/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={bulkBarStyle}>
          <span style={{ fontWeight: 700, color: "var(--green-900)" }}>
            {selected.size} listing{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSelected(new Set())}
              className="btn btn-secondary"
              style={{ padding: "6px 14px", fontSize: 13 }}
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid rgba(220,38,38,0.3)",
                background: "rgba(220,38,38,0.9)",
                color: "white",
                fontWeight: 700,
                cursor: bulkDeleting ? "wait" : "pointer",
              }}
            >
              {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--soft)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ ...thStyle, width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  title="Select all"
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Seller</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <AdminListingRow
                key={listing.id}
                listing={listing}
                ownerName={profileMap.get(listing.owner_id) ?? "Unknown"}
                isSelected={selected.has(listing.id)}
                onToggle={() => toggleOne(listing.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminListingRow({
  listing,
  ownerName,
  isSelected,
  onToggle,
}: {
  listing: Listing;
  ownerName: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [featuring, setFeaturing] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/approve`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setShowReject(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleFeature() {
    if (featuring) return;
    setFeaturing(true);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/feature`, {
        method: listing.is_featured ? "DELETE" : "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setFeaturing(false);
    }
  }

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--border)", background: isSelected ? "rgba(11,47,26,0.04)" : undefined }}>
        <td style={{ ...tdStyle, width: 40 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            style={{ cursor: "pointer" }}
          />
        </td>
        <td style={tdStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {listing.is_featured && (
              <span title="Featured" style={{ color: "rgba(234,179,8,1)", fontSize: 16 }}>★</span>
            )}
            <Link
              href={`/listings/${listing.id}`}
              style={{ fontWeight: 700, color: "var(--green-900)", textDecoration: "none" }}
            >
              {listing.title || "Untitled"}
            </Link>
          </div>
        </td>
        <td style={tdStyle}>
          <span className="pill" style={{ fontSize: 11 }}>{listing.category}</span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontWeight: 700, color: "var(--green-900)" }}>
            {formatPrice(listing.price_eur)}
          </span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontWeight: 650, color: "var(--text)" }}>{ownerName}</span>
        </td>
        <td style={tdStyle}>
          <StatusBadge status={listing.status} />
        </td>
        <td style={tdStyle}>
          <span style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13 }}>
            {formatDate(listing.created_at)}
          </span>
        </td>
        <td style={tdStyle}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {listing.status === "pending" && (
              <>
                <button onClick={handleApprove} disabled={loading} className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }}>
                  Approve
                </button>
                <button onClick={() => setShowReject(true)} disabled={loading} className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }}>
                  Reject
                </button>
              </>
            )}
            {listing.status === "rejected" && (
              <button onClick={handleApprove} disabled={loading} className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }}>
                Approve
              </button>
            )}
            {listing.status === "active" && (
              <button
                onClick={handleFeature}
                disabled={featuring}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: listing.is_featured ? "1px solid rgba(234,179,8,0.4)" : "1px solid var(--border)",
                  background: listing.is_featured ? "rgba(234,179,8,0.15)" : "var(--soft)",
                  color: listing.is_featured ? "rgba(161,98,7,1)" : "var(--green-900)",
                  fontWeight: 700,
                  cursor: featuring ? "wait" : "pointer",
                }}
              >
                {featuring ? "..." : listing.is_featured ? "★ Unfeature" : "☆ Feature"}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid rgba(220,38,38,0.3)",
                background: "rgba(220,38,38,0.1)",
                color: "rgba(153,27,27,1)",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {showReject && (
        <tr>
          <td colSpan={8} style={{ padding: 12, background: "rgba(220,38,38,0.05)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason..."
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.3)", fontWeight: 600 }}
              />
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "rgba(220,38,38,1)", color: "white", fontWeight: 700, cursor: loading ? "wait" : "pointer" }}
              >
                Confirm Reject
              </button>
              <button onClick={() => setShowReject(false)} className="btn btn-secondary" style={{ padding: "8px 16px" }}>
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; border: string; color: string }> = {
    pending: { label: "Pending", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.4)", color: "rgba(161,98,7,1)" },
    active: { label: "Active", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.4)", color: "rgba(22,101,52,1)" },
    sold: { label: "Sold", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.4)", color: "rgba(30,64,175,1)" },
    rejected: { label: "Rejected", bg: "rgba(220,38,38,0.1)", border: "rgba(220,38,38,0.4)", color: "rgba(153,27,27,1)" },
  };

  const c = config[status] ?? config.active;

  return (
    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {c.label}
    </span>
  );
}

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IE", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  color: "var(--muted)",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};

const bulkBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 16px",
  marginBottom: 8,
  borderRadius: 12,
  background: "rgba(11,47,26,0.06)",
  border: "1px solid rgba(11,47,26,0.14)",
};
