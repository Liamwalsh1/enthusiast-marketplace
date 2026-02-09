import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/wheels`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/parts`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/memorabilia`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Fetch all active listings for the sitemap
  const { data: listings } = await supabase
    .from("listings")
    .select("id, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5000);

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map((listing) => ({
    url: `${siteUrl}/listings/${listing.id}`,
    lastModified: new Date(listing.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...listingPages];
}
