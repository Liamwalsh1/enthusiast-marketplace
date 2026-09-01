import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Enthusiast Cars & Wheels for Sale",
  description:
    "Explore enthusiast cars and wheels for sale in Ireland. Filter by make, model, year, price, and location.",
  openGraph: {
    title: "Browse Enthusiast Cars & Wheels for Sale",
    description:
      "Explore enthusiast cars and wheels for sale in Ireland.",
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
