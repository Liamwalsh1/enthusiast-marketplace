"use client";

import { useState } from "react";
import ReportListingModal from "./ReportListingModal";

export default function ReportListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          fontWeight: 650,
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
          padding: 0,
          textAlign: "center",
          width: "100%",
        }}
      >
        Report this listing
      </button>
      <ReportListingModal open={open} listingId={listingId} onClose={() => setOpen(false)} />
    </>
  );
}
