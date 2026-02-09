"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  listingId: string;
};

export default function UnsaveButton({ listingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnsave() {
    if (loading) return;
    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        alert("Your session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/saved-listings/${listingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to unsave listing.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <button
      className="btn btn-secondary"
      type="button"
      onClick={handleUnsave}
      disabled={loading}
      style={{ color: "rgba(220,38,38,1)" }}
    >
      {loading ? "..." : "Remove"}
    </button>
  );
}
