import type { Metadata } from "next";
import CategoryListings from "@/app/components/CategoryListings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Classic Car Wheels & Rims for Sale",
  description:
    "Find vintage and classic car wheels, rims, and alloys for sale in Ireland. BBS, OZ Racing, Minilite, and more.",
  openGraph: {
    title: "Classic Car Wheels & Rims for Sale",
    description:
      "Find vintage and classic car wheels, rims, and alloys for sale in Ireland.",
  },
};

export default function WheelsPage() {
  return (
    <CategoryListings
      category="wheels"
      title="Wheels"
      description="Browse wheels and rims for sale"
    />
  );
}
