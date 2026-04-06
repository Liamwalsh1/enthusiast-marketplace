import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ToastProvider from "./components/ToastProvider";
import CookieBanner from "./components/CookieBanner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

export const metadata: Metadata = {
  title: {
    default: "Passion Driven | Classic Cars, Parts & Memorabilia in Ireland",
    template: "%s | Passion Driven",
  },
  description:
    "Ireland's marketplace for classic cars, vintage parts, and automotive memorabilia. Buy and sell with enthusiasts who care about provenance and condition.",
  keywords: [
    "classic cars Ireland",
    "vintage cars for sale",
    "classic car parts",
    "automotive memorabilia",
    "classic car marketplace",
    "vintage wheels",
    "car enthusiast",
  ],
  authors: [{ name: "Passion Driven" }],
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: siteUrl,
    siteName: "Passion Driven",
    title: "Passion Driven | Classic Cars, Parts & Memorabilia",
    description:
      "Ireland's marketplace for classic cars, vintage parts, and automotive memorabilia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Passion Driven | Classic Cars, Parts & Memorabilia",
    description:
      "Ireland's marketplace for classic cars, vintage parts, and automotive memorabilia.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CookieBanner />
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
