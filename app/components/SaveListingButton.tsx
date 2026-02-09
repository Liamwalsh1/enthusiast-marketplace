"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  listingId: string;
  isLoggedIn: boolean;
  initialSaved?: boolean;
  variant?: "icon" | "button";
};

export default function SaveListingButton({
  listingId,
  isLoggedIn,
  initialSaved = false,
  variant = "button",
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(!initialSaved && isLoggedIn);

  // Check saved status on mount if logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    async function checkSaved() {
      try {
        const res = await fetch(`/api/saved-listings/${listingId}`);
        const data = await res.json();
        setSaved(data.saved);
      } catch {
        // Ignore errors
      } finally {
        setChecking(false);
      }
    }

    checkSaved();
  }, [listingId, isLoggedIn]);

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=/listings/${listingId}`);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        alert("Your session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      if (saved) {
        // Unsave
        const res = await fetch(`/api/saved-listings/${listingId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setSaved(false);
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error ?? "Failed to unsave listing.");
        }
      } else {
        // Save
        const res = await fetch("/api/saved-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: listingId }),
        });

        if (res.ok) {
          setSaved(true);
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error ?? "Failed to save listing.");
        }
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    if (variant === "icon") {
      return (
        <button
          type="button"
          style={iconButtonStyles}
          disabled
          title="Loading..."
        >
          <HeartIcon filled={false} />
        </button>
      );
    }
    return (
      <button className="btn btn-secondary" type="button" disabled>
        Loading...
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        style={{
          ...iconButtonStyles,
          color: saved ? "rgba(220,38,38,1)" : "var(--muted)",
        }}
        onClick={handleToggle}
        disabled={loading}
        title={saved ? "Remove from saved" : "Save listing"}
      >
        <HeartIcon filled={saved} />
      </button>
    );
  }

  return (
    <button
      className={saved ? "btn btn-secondary" : "btn btn-secondary"}
      type="button"
      onClick={handleToggle}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: saved ? "rgba(220,38,38,1)" : undefined,
      }}
    >
      <HeartIcon filled={saved} />
      {loading ? "..." : saved ? "Saved" : "Save"}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

const iconButtonStyles: CSSProperties = {
  background: "none",
  border: "none",
  padding: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  transition: "background 0.15s",
};
