import type { Metadata } from "next";
import CategoryListings from "@/app/components/CategoryListings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Classic Cars for Sale in Ireland",
  description:
    "Browse classic and vintage cars for sale in Ireland. Find Mustangs, Porsches, MGs, and more from passionate enthusiasts.",
  openGraph: {
    title: "Classic Cars for Sale in Ireland",
    description:
      "Browse classic and vintage cars for sale in Ireland. Find Mustangs, Porsches, MGs, and more.",
  },
};

export default function CarsPage() {
  return (
    <CategoryListings
      category="car"
      title="Cars"
      description="Browse classic and enthusiast cars for sale"
    />
  );
}
