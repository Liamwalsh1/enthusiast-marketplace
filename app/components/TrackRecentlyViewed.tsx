"use client";

import { useEffect, useRef } from "react";
import { addRecentlyViewed } from "@/app/lib/recentlyViewed";

type Props = {
  id: string;
  title: string;
  price_eur: number | null;
  image_url: string | null;
  category: string;
};

export default function TrackRecentlyViewed({ id, title, price_eur, image_url, category }: Props) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Add to local recently viewed
    addRecentlyViewed({ id, title, price_eur, image_url, category });

    // Record view in database (only once per mount)
    if (!hasTracked.current) {
      hasTracked.current = true;
      fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      }).catch(() => {
        // Silently fail - view tracking shouldn't break the page
      });
    }
  }, [id, title, price_eur, image_url, category]);

  return null;
}
