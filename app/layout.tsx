import "./globals.css";
import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ToastProvider from "./components/ToastProvider";
import CookieBanner from "./components/CookieBanner";
import EarlyAccessBanner from "./components/EarlyAccessBanner";
import ScrollProgressBar from "./components/ScrollProgressBar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

export const metadata: Metadata = {
  title: {
    default: "PassionDriven | Enthusiast Cars & Wheels for Sale in Ireland",
    template: "%s | PassionDriven",
  },
  description:
    "Buy and sell enthusiast cars and wheels in Ireland. Trusted listings for collectors, builders and petrolheads. Ireland's marketplace for enthusiast cars.",
  keywords: [
    "cars for sale Ireland",
    "enthusiast cars Ireland",
    "modified cars for sale Ireland",
    "classic cars Ireland",
    "used sports cars Ireland",
    "JDM cars Ireland",
    "performance cars Ireland",
    "alloy wheels Ireland",
    "wheels for sale Ireland",
    "used cars Ireland",
    "cars for sale",
  ],
  authors: [{ name: "PassionDriven" }],
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: siteUrl,
    siteName: "PassionDriven",
    title: "PassionDriven | Enthusiast Cars & Wheels for Sale in Ireland",
    description:
      "Ireland's marketplace for enthusiast cars and wheels. Trusted listings for collectors, builders and petrolheads.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PassionDriven | Enthusiast Cars & Wheels for Sale in Ireland",
    description:
      "Ireland's marketplace for enthusiast cars and wheels. Trusted listings for collectors, builders and petrolheads.",
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
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-29P61D0TGM" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-29P61D0TGM');` }} />
      </head>
      <body>
        <ToastProvider>
          <ScrollProgressBar />
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
