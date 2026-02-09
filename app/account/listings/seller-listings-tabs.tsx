"use client";

import { useState, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SellerControls from "@/app/components/SellerControls";

type Listing = {
  id: string;
  title: string | null;
  price_eur: number | null;
  status: string | null;
  created_at: string | null;
  sold_at: string | null;
  rejection_reason: string | null;
  view_count: number | null;
  save_count: number | null;
  inquiry_count: number | null;
};

type TabType = "active" | "sold" | "pending" | "rejected";

type Props = {
  activeTab: TabType;
  counts: { active: number; sold: number; pending: number; rejected: number; total: number };
  listings: Listing[];
};

export default function SellerListingsTabs({ activeTab, counts, listings }: Props) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  };

  const handleBulkAction = async (action: "sold" | "delete") => {
    if (selectedIds.size === 0) return;

    const confirmMsg = action === "sold"
      ? `Mark ${selectedIds.size} listing(s) as sold?`
      : `Delete ${selectedIds.size} listing(s)? This cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    setBulkLoading(true);
    try {
      const endpoint = action === "sold" ? "/api/listings/bulk-sold" : "/api/listings/bulk-delete";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to perform action");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.tabsRow}>
        <div style={styles.tabsWrap}>
          <TabLink href="/account/listings?status=pending" active={activeTab === "pending"} variant={counts.pending > 0 ? "warning" : undefined}>
            Pending ({counts.pending})
          </TabLink>
          <TabLink href="/account/listings?status=active" active={activeTab === "active"}>
            Active ({counts.active})
          </TabLink>
          <TabLink href="/account/listings?status=sold" active={activeTab === "sold"}>
            Sold ({counts.sold})
          </TabLink>
          <TabLink href="/account/listings?status=rejected" active={activeTab === "rejected"} variant={counts.rejected > 0 ? "error" : undefined}>
            Rejected ({counts.rejected})
          </TabLink>
        </div>
        <div style={styles.totalText}>Total: {counts.total}</div>
      </div>

      {listings.length > 0 && activeTab === "active" && (
        <div style={styles.bulkActions}>
          <label style={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedIds.size === listings.length && listings.length > 0}
              onChange={selectAll}
              style={styles.checkbox}
            />
            Select all
          </label>
          {selectedIds.size > 0 && (
            <div style={styles.bulkButtons}>
              <span style={styles.selectedCount}>{selectedIds.size} selected</span>
              <button
                className="btn btn-secondary"
                onClick={() => handleBulkAction("sold")}
                disabled={bulkLoading}
                style={styles.bulkBtn}
              >
                Mark as Sold
              </button>
              <button
                className="btn"
                onClick={() => handleBulkAction("delete")}
                disabled={bulkLoading}
                style={{ ...styles.bulkBtn, ...styles.deleteBtn }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {listings.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div style={styles.listingsGrid}>
          {listings.map((listing) => (
            <article key={listing.id} className="card" style={styles.listingCard}>
              <div style={styles.listingHeader}>
                {activeTab === "active" && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(listing.id)}
                    onChange={() => toggleSelect(listing.id)}
                    style={styles.checkbox}
                  />
                )}
                <div style={styles.listingInfo}>
                  <Link href={`/listings/${listing.id}`} style={styles.listingTitle}>
                    {listing.title?.trim() || "Untitled listing"}
                  </Link>
                  <div style={styles.listingMeta}>{formatListingDate(listing)}</div>
                  <StatusBadge status={listing.status} />
                </div>
                <div style={styles.listingRight}>
                  <span style={styles.price}>{formatPrice(listing.price_eur)}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setOpenId(openId === listing.id ? null : listing.id)}
                  >
                    {openId === listing.id ? "Hide" : "Manage"}
                  </button>
                </div>
              </div>

              {/* Analytics row for active listings */}
              {activeTab === "active" && (listing.view_count || listing.save_count || listing.inquiry_count) ? (
                <div style={styles.analyticsRow}>
                  <div style={styles.analyticChip}>
                    <span style={styles.analyticIcon}>👁</span>
                    {listing.view_count ?? 0} views
                  </div>
                  <div style={styles.analyticChip}>
                    <span style={styles.analyticIcon}>♥</span>
                    {listing.save_count ?? 0} saves
                  </div>
                  <div style={styles.analyticChip}>
                    <span style={styles.analyticIcon}>💬</span>
                    {listing.inquiry_count ?? 0} inquiries
                  </div>
                </div>
              ) : null}

              {listing.status === "rejected" && listing.rejection_reason && (
                <div style={styles.rejectionBox}>
                  <div style={styles.rejectionLabel}>Rejection Reason</div>
                  <p style={styles.rejectionText}>{listing.rejection_reason}</p>
                </div>
              )}

              {openId === listing.id ? (
                <div style={styles.manageBox}>
                  <SellerControls listingId={listing.id} status={listing.status} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TabLink({ href, active, children, variant }: { href: string; active: boolean; children: ReactNode; variant?: "warning" | "error" }) {
  let style: CSSProperties = active ? styles.tabActive : styles.tab;
  if (active && variant === "warning") {
    style = { ...style, ...styles.tabWarning };
  } else if (active && variant === "error") {
    style = { ...style, ...styles.tabError };
  }

  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}

function EmptyState({ activeTab }: { activeTab: TabType }) {
  const messages: Record<TabType, { title: string; description: string }> = {
    pending: {
      title: "No pending listings.",
      description: "New listings will appear here while awaiting admin approval.",
    },
    active: {
      title: "No active listings yet.",
      description: "Create your first listing to start selling.",
    },
    sold: {
      title: "No sold listings yet.",
      description: "Mark listings as sold once the buyer is confirmed.",
    },
    rejected: {
      title: "No rejected listings.",
      description: "Listings that don't meet guidelines will appear here with feedback.",
    },
  };

  const { title, description } = messages[activeTab];

  return (
    <div className="card" style={styles.emptyState}>
      <div style={styles.emptyTitle}>{title}</div>
      <p style={styles.emptyText}>{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const statusStyles: Record<string, CSSProperties> = {
    pending: { background: "rgba(251, 191, 36, 0.15)", color: "rgb(180, 83, 9)" },
    active: { background: "var(--soft)", color: "var(--green-900)" },
    sold: { background: "rgba(239, 68, 68, 0.15)", color: "rgb(185, 28, 28)" },
    rejected: { background: "rgba(239, 68, 68, 0.15)", color: "rgb(185, 28, 28)" },
  };

  const labels: Record<string, string> = {
    pending: "Pending Review",
    active: "Active",
    sold: "Sold",
    rejected: "Rejected",
  };

  const badgeStyle = statusStyles[status ?? "active"] ?? statusStyles.active;
  const label = labels[status ?? "active"] ?? "Active";

  return <span style={{ ...styles.badge, ...badgeStyle }}>{label}</span>;
}

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  const isWhole = Number.isInteger(price);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(price);
}

function formatListingDate(listing: Listing) {
  const format = (raw: string) => {
    try {
      return new Date(raw).toLocaleDateString("en-IE", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "recently";
    }
  };

  if (listing.status === "sold" && listing.sold_at) {
    return `Sold ${format(listing.sold_at)}`;
  }

  if (listing.created_at) {
    return `Listed ${format(listing.created_at)}`;
  }

  return "Listed recently";
}

const styles: Record<string, CSSProperties> = {
  section: {
    marginTop: 24,
  },
  tabsRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tabsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: 8,
    background: "white",
    borderRadius: 999,
    border: "1px solid var(--border)",
  },
  tab: {
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 650,
    color: "var(--muted)",
    textDecoration: "none",
  },
  tabActive: {
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 650,
    background: "var(--soft)",
    color: "var(--green-900)",
    textDecoration: "none",
    border: "1px solid var(--border)",
  },
  tabWarning: {
    background: "rgba(251, 191, 36, 0.15)",
    color: "rgb(180, 83, 9)",
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  tabError: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "rgb(185, 28, 28)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  totalText: {
    fontSize: 14,
    fontWeight: 650,
    color: "var(--muted)",
  },
  bulkActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    padding: 12,
    background: "var(--soft)",
    borderRadius: 12,
    border: "1px solid var(--border)",
  },
  selectAllLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 650,
    color: "var(--green-900)",
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "var(--green-900)",
    cursor: "pointer",
  },
  bulkButtons: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--green-900)",
  },
  bulkBtn: {
    padding: "8px 14px",
    fontSize: 14,
  },
  deleteBtn: {
    background: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    color: "rgb(185, 28, 28)",
  },
  listingsGrid: {
    display: "grid",
    gap: 12,
    marginTop: 16,
  },
  listingCard: {
    padding: 16,
  },
  listingHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  listingInfo: {
    flex: 1,
    minWidth: 0,
  },
  listingTitle: {
    fontWeight: 700,
    color: "var(--green-900)",
    textDecoration: "none",
  },
  listingMeta: {
    fontSize: 13,
    fontWeight: 650,
    color: "var(--muted)",
    marginTop: 4,
  },
  listingRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 900,
    color: "var(--green-900)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    marginTop: 8,
  },
  analyticsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid var(--border)",
  },
  analyticChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 650,
    color: "var(--muted)",
  },
  analyticIcon: {
    fontSize: 14,
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "rgb(185, 28, 28)",
  },
  rejectionText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 650,
    color: "rgb(153, 27, 27)",
  },
  manageBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "var(--soft)",
    border: "1px solid var(--border)",
  },
  emptyState: {
    padding: 32,
    textAlign: "center",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "var(--green-900)",
  },
  emptyText: {
    marginTop: 8,
    color: "var(--muted)",
    fontWeight: 650,
  },
};
