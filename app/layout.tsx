import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ToastProvider from "./components/ToastProvider";
import CookieBanner from "./components/CookieBanner";
import EarlyAccessBanner from "./components/EarlyAccessBanner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.png",
  },
  title: {
    default: "PassionDriven | Enthusiast Cars, Parts & Memorabilia for Sale in Ireland",
    template: "%s | PassionDriven",
  },
  description:
    "Buy and sell enthusiast cars, modified cars, classic cars, performance parts and memorabilia in Ireland. Ireland's marketplace for petrolheads.",
  keywords: [
    "cars for sale Ireland",
    "enthusiast cars Ireland",
    "modified cars for sale Ireland",
    "classic cars Ireland",
    "used sports cars Ireland",
    "JDM cars Ireland",
    "performance cars Ireland",
    "car parts Ireland",
    "automotive memorabilia Ireland",
    "used cars Ireland",
    "cars for sale",
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
  verification: {
    google: "442SwS5fq2x3m_mnSj-l36zuvAYM-cdNLlPYmXLz2Zg",
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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-29P61D0TGM" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-29P61D0TGM');` }} />
      </head>
      <body>
        <ToastProvider>
          <EarlyAccessBanner />
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
