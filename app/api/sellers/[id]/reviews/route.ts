import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// GET - Get all reviews for a seller
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sellerId } = await params;
  const supabase = await createServerSupabaseClient();

  // Get reviews with user info using the RPC function
  const { data: reviews, error: reviewsError } = await supabase.rpc(
    "get_seller_reviews_with_users",
    { p_seller_id: sellerId }
  );

  if (reviewsError) {
    // Fallback to direct query if function doesn't exist
    const { data: directReviews, error: directError } = await supabase
      .from("seller_reviews")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (directError) {
      return NextResponse.json({ error: directError.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: directReviews ?? [], stats: null });
  }

  // Get seller stats
  const { data: stats } = await supabase.rpc("get_seller_stats", {
    p_seller_id: sellerId,
  });

  return NextResponse.json({
    reviews: reviews ?? [],
    stats: stats?.[0] ?? null,
  });
}
