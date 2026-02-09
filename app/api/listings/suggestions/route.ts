import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = await createServerSupabaseClient();
  const pattern = `%${query}%`;

  // Search across multiple fields using OR
  // Priority: title matches, then make/model, then wheel_brand/style
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, make, model, wheel_brand")
    .in("status", ["active", "sold"])
    .or(
      `title.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern},wheel_brand.ilike.${pattern}`
    )
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Suggestions search error:", error.message);
    return NextResponse.json({ suggestions: [] });
  }

  // Sort results by relevance (title matches first)
  const suggestions = (data || []).sort((a, b) => {
    const aTitle = a.title?.toLowerCase() || "";
    const bTitle = b.title?.toLowerCase() || "";
    const q = query.toLowerCase();

    // Exact title match at start
    const aStartsWithTitle = aTitle.startsWith(q) ? 2 : 0;
    const bStartsWithTitle = bTitle.startsWith(q) ? 2 : 0;

    // Title contains query
    const aTitleContains = aTitle.includes(q) ? 1 : 0;
    const bTitleContains = bTitle.includes(q) ? 1 : 0;

    const aScore = aStartsWithTitle + aTitleContains;
    const bScore = bStartsWithTitle + bTitleContains;

    return bScore - aScore;
  });

  return NextResponse.json({ suggestions });
}
