"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function DismissReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function dismiss() {
    setLoading(true);
    await supabase.from("listing_reports").update({ status: "dismissed" }).eq("id", reportId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={dismiss}
      disabled={loading}
      className="btn btn-secondary"
      style={{ fontSize: 13, padding: "6px 14px" }}
    >
      {loading ? "Dismissing…" : "Dismiss"}
    </button>
  );
}
