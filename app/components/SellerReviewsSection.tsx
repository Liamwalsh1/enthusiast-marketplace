import Link from "next/link";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { RatingDisplay } from "./StarRating";
import ReviewList, { type Review } from "./ReviewList";
import ReviewFormWrapper from "./ReviewFormWrapper";

type Props = {
  sellerId: string;
  listingId: string;
  listingTitle: string;
};

type SellerStats = {
  avg_rating: number | null;
  review_count: number;
};

export default async function SellerReviewsSection({
  sellerId,
  listingId,
  listingTitle,
}: Props) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is the seller (don't show review form to seller)
  const isSeller = user?.id === sellerId;

  // Get seller stats
  let stats: SellerStats | null = null;
  const { data: statsData } = await supabase.rpc("get_seller_stats", {
    p_seller_id: sellerId,
  });
  if (statsData && statsData.length > 0) {
    stats = statsData[0];
  }

  // Get reviews with user info
  let reviews: Review[] = [];
  const { data: reviewsData, error: reviewsError } = await supabase.rpc(
    "get_seller_reviews_with_users",
    { p_seller_id: sellerId }
  );

  if (reviewsError) {
    // Fallback to direct query if function doesn't exist
    const { data: directReviews } = await supabase
      .from("seller_reviews")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    reviews = (directReviews ?? []) as Review[];
  } else {
    reviews = (reviewsData ?? []) as Review[];
  }

  // Check if current user already reviewed this seller for this listing
  let hasReviewed = false;
  if (user && !isSeller) {
    const { data: existingReview } = await supabase
      .from("seller_reviews")
      .select("id")
      .eq("seller_id", sellerId)
      .eq("reviewer_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();
    hasReviewed = !!existingReview;
  }

  // Get seller profile for display name
  const { data: sellerProfile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", sellerId)
    .maybeSingle();

  const sellerName = sellerProfile?.display_name || "Seller";

  return (
    <section className="card" style={{ padding: 16, marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontWeight: 950,
                color: "var(--green-900)",
                fontSize: 20,
              }}
            >
              Seller Reviews
            </span>
            <Link
              href={`/sellers/${sellerId}`}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--green-600)",
                textDecoration: "none",
              }}
            >
              View profile →
            </Link>
          </div>
          <RatingDisplay
            rating={stats?.avg_rating ?? null}
            reviewCount={Number(stats?.review_count ?? 0)}
          />
        </div>
      </div>

      {!isSeller && !hasReviewed && (
        <div style={{ marginBottom: 16 }}>
          <ReviewFormWrapper
            sellerId={sellerId}
            listingId={listingId}
            listingTitle={listingTitle}
            sellerName={sellerName}
            isLoggedIn={!!user}
          />
        </div>
      )}

      {hasReviewed && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "rgba(22,101,52,1)",
            fontWeight: 700,
          }}
        >
          You have already reviewed this seller for this listing.
        </div>
      )}

      <ReviewList reviews={reviews} currentUserId={user?.id ?? null} />
    </section>
  );
}
