"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import SellerControls from "@/app/components/SellerControls";

type Listing = {
  id: string;
  title: string | null;
  price: number | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
  sold_at: string | null;
};

type Props = {
  activeTab: "active" | "sold";
  counts: { active: number; sold: number; total: number };
  listings: Listing[];
};

export default function SellerListingsTabs({ activeTab, counts, listings }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TabLink href="/account/listings?status=active" active={activeTab === "active"}>
            Active ({counts.active})
          </TabLink>
          <TabLink href="/account/listings?status=sold" active={activeTab === "sold"}>
            Sold ({counts.sold})
          </TabLink>
        </div>
        <div className="text-sm font-semibold text-[color:var(--muted)]">
          Total listings: {counts.total}
        </div>
      </div>

      {listings.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <article key={listing.id} className="card flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-lg font-semibold text-[color:var(--green-900)] underline-offset-4 hover:underline"
                  >
                    {listing.title?.trim() || "Untitled listing"}
                  </Link>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">{formatListingDate(listing)}</div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className="text-xl font-extrabold text-[color:var(--green-900)]">{formatPrice(listing.price)}</span>
                  <StatusBadge status={listing.status} />
                </div>
              </div>
              <SellerControls listingId={listing.id} status={listing.status} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[color:var(--green-900)] bg-[color:var(--soft)] text-[color:var(--green-900)]"
          : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--green-900)]"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyState({ activeTab }: { activeTab: "active" | "sold" }) {
  if (activeTab === "active") {
    return (
      <div className="card rounded-2xl border border-dashed border-[color:var(--border)] bg-white p-10 text-center">
        <div className="text-xl font-black text-[color:var(--green-900)]">No active listings yet.</div>
        <p className="mt-2 text-[color:var(--muted)] font-semibold">
          Create your first listing to start selling.
        </p>
        <Link className="btn btn-primary mt-4 inline-flex" href="/sell">
          Create listing
        </Link>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl border border-dashed border-[color:var(--border)] bg-white p-10 text-center">
      <div className="text-xl font-black text-[color:var(--green-900)]">No sold listings yet.</div>
      <p className="mt-2 text-[color:var(--muted)] font-semibold">
        Mark listings as sold once the buyer is confirmed.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const isSold = status === "sold";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        isSold ? "bg-red-100 text-red-700" : "bg-[color:var(--soft)] text-[color:var(--green-900)]"
      }`}
    >
      {isSold ? "Sold" : "Active"}
    </span>
  );
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

  const raw = listing.updated_at ?? listing.created_at;
  if (!raw) return "Updated recently";
  return `Updated ${format(raw)}`;
}
