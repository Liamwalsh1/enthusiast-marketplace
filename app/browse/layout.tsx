import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Classic Cars & Parts for Sale",
  description:
    "Explore classic cars, vintage wheels, parts, and automotive memorabilia for sale in Ireland. Filter by make, model, year, price, and location.",
  openGraph: {
    title: "Browse Classic Cars & Parts for Sale",
    description:
      "Explore classic cars, vintage wheels, parts, and automotive memorabilia for sale in Ireland.",
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
