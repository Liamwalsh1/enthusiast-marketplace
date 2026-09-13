import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { rateLimit, getIp } from "@/app/lib/rateLimit";

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
  try {
    if (!rateLimit(`views:${getIp(request)}`, 60, 60 * 1000)) {
      return NextResponse.json({ ok: true }); // silent — don't surface rate limit errors to users
    }

    const { listingId } = await request.json();

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // For authenticated users, skip if they've already viewed this listing in the last 24h
    if (user) {
      const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
      const { data: existing } = await supabase
        .from("listing_views")
        .select("id")
        .eq("listing_id", listingId)
        .eq("viewer_id", user.id)
        .gte("viewed_at", since)
        .limit(1)
        .maybeSingle();

      if (existing) return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from("listing_views").insert({
      listing_id: listingId,
      viewer_id: user?.id ?? null,
      is_authenticated: !!user,
    });

    if (error) {
      console.error("Failed to record view:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("View tracking error:", err);
    return NextResponse.json({ ok: true });
  }
}
