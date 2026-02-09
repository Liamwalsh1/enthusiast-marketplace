import type { Metadata } from "next";
import CategoryListings from "@/app/components/CategoryListings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Classic Car Parts & Accessories for Sale",
  description:
    "Browse vintage car parts, engines, gearboxes, trim, and accessories for sale in Ireland. Find hard-to-get parts for your restoration project.",
  openGraph: {
    title: "Classic Car Parts & Accessories for Sale",
    description:
      "Browse vintage car parts, engines, gearboxes, trim, and accessories for sale in Ireland.",
  },
};

export default function PartsPage() {
  return (
    <CategoryListings
      category="part"
      title="Parts"
      description="Browse car parts and accessories for sale"
    />
  );
}
