import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { listingId } = await request.json();

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Record the view
    const { error } = await supabase.from("listing_views").insert({
      listing_id: listingId,
      viewer_id: user?.id ?? null,
      is_authenticated: !!user,
    });

    if (error) {
      console.error("Failed to record view:", error.message);
      // Don't return error to client - view tracking shouldn't break the page
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("View tracking error:", err);
    return NextResponse.json({ ok: true });
  }
}
