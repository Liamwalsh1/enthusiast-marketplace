import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export const BOOST_PRICE_ID = process.env.STRIPE_BOOST_PRICE_ID;
export const FEATURED_PRICE_ID = process.env.STRIPE_FEATURED_PRICE_ID;
