"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useToast } from "@/app/components/useToast";

type Props = {
  listingId: string;
  status?: string | null;
};

export default function SellerControls({ listingId, status }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<"sold" | "delete" | "active" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const currentStatus = status ?? "active";
  const disableActions = loading !== null;
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function markSold() {
    if (loading) return;
    setLoading("sold");
    setError(null);
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold", sold_at: new Date().toISOString() })
      .eq("id", listingId);
    if (error) {
      setError(error.message);
      toast({ type: "error", message: error.message });
      setLoading(null);
      return;
    }
    toast({ type: "success", message: "Marked as sold" });
    setLoading(null);
    router.refresh();
  }

  async function markActive() {
    if (loading) return;
    setLoading("active");
    setError(null);
    const { error } = await supabase.from("listings").update({ status: "active", sold_at: null }).eq("id", listingId);
    if (error) {
      setError(error.message);
      toast({ type: "error", message: error.message });
      setLoading(null);
      return;
    }
    toast({ type: "success", message: "Marked as active" });
    setLoading(null);
    router.refresh();
  }

  async function deleteListing() {
    if (loading) return;
    setLoading("delete");
    setError(null);
    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) {
      setError(error.message);
      toast({ type: "error", message: error.message });
      setLoading(null);
      return;
    }
    toast({ type: "success", message: "Listing deleted" });
    setConfirmOpen(false);
    setLoading(null);
    if (pathname === "/account/listings") {
      router.refresh();
    } else {
      router.replace("/account/listings");
      router.refresh();
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 950, color: "var(--green-900)" }}>Seller controls</div>
      <div style={{ color: "var(--muted)", fontWeight: 650 }}>Status: {currentStatus}</div>
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => router.push(`/listings/${listingId}/edit`)}
        disabled={disableActions}
      >
        Edit listing
      </button>
      {currentStatus !== "sold" ? (
        <button className="btn btn-primary" type="button" onClick={markSold} disabled={disableActions}>
          {loading === "sold" ? "Marking…" : "Mark as sold"}
        </button>
      ) : (
        <button className="btn btn-secondary" type="button" onClick={markActive} disabled={disableActions}>
          {loading === "active" ? "Updating…" : "Mark as active"}
        </button>
      )}
      <button
        className="btn btn-secondary"
        style={{ borderColor: "rgba(220,38,38,0.4)", color: "rgba(220,38,38,1)" }}
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={disableActions}
      >
        {loading === "delete" ? "Deleting…" : "Delete listing"}
      </button>
      {error ? (
        <div className="card" style={errorStyles}>
          {error}
        </div>
      ) : null}
    </div>
      <ConfirmModal
        open={confirmOpen}
        title="Delete listing?"
        description="This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading === "delete"}
        onConfirm={deleteListing}
        onCancel={() => {
          if (!disableActions) setConfirmOpen(false);
        }}
      />
    </>
  );
}

const errorStyles: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.3)",
  background: "rgba(220,38,38,.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
};
