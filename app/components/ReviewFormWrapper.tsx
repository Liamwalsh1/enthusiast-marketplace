"use client";

import { useState } from "react";
import ReviewForm from "./ReviewForm";

type Props = {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  sellerName: string;
  isLoggedIn: boolean;
};

export default function ReviewFormWrapper({
  sellerId,
  listingId,
  listingTitle,
  sellerName,
  isLoggedIn,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => setShowForm(true)}
        style={{ width: "100%" }}
      >
        Write a review for {sellerName}
      </button>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--soft)",
        border: "1px solid var(--border)",
      }}
    >
      <ReviewForm
        sellerId={sellerId}
        listingId={listingId}
        listingTitle={listingTitle}
        isLoggedIn={isLoggedIn}
        onSuccess={() => setShowForm(false)}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}
