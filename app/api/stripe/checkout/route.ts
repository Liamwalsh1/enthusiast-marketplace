import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { stripe, BOOST_PRICE_ID, FEATURED_PRICE_ID } from "@/app/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, product } = body as {
      listingId: string;
      product: "boost" | "featured";
    };

    if (!listingId || !product) {
      return NextResponse.json(
        { error: "Missing listingId or product" },
        { status: 400 }
      );
    }

    if (product !== "boost" && product !== "featured") {
      return NextResponse.json(
        { error: "Invalid product type" },
        { status: 400 }
      );
    }

    // Verify user owns the listing and it's active
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, owner_id, status, title")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You do not own this listing" },
        { status: 403 }
      );
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "Only active listings can be promoted" },
        { status: 400 }
      );
    }

    // Get the price ID based on product type
    const priceId = product === "boost" ? BOOST_PRICE_ID : FEATURED_PRICE_ID;

    if (!priceId) {
      console.error(`Missing price ID for product: ${product}`);
      return NextResponse.json(
        { error: "Payment configuration error" },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const origin = request.headers.get("origin") || "https://passiondriven.ie";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        listingId,
        userId: user.id,
        product,
      },
      success_url: `${origin}/account/listings?payment=success&product=${product}`,
      cancel_url: `${origin}/listings/${listingId}?payment=cancelled`,
      customer_email: user.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
