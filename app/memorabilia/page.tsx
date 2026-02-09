import type { Metadata } from "next";
import CategoryListings from "@/app/components/CategoryListings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Automotive Memorabilia & Collectibles for Sale",
  description:
    "Discover automotive memorabilia, vintage signs, model cars, literature, and collectibles for sale in Ireland.",
  openGraph: {
    title: "Automotive Memorabilia & Collectibles for Sale",
    description:
      "Discover automotive memorabilia, vintage signs, model cars, literature, and collectibles for sale in Ireland.",
  },
};

export default function MemorabiliaPage() {
  return (
    <CategoryListings
      category="memorabilia"
      title="Memorabilia"
      description="Browse automotive memorabilia and collectibles"
    />
  );
}
