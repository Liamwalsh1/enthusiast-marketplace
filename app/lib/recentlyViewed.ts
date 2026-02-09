"use client";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 20;

export type RecentlyViewedItem = {
  id: string;
  title: string;
  price_eur: number | null;
  image_url: string | null;
  category: string;
  viewedAt: number;
};

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const items = getRecentlyViewed();
    // Remove if already exists
    const filtered = items.filter((i) => i.id !== item.id);
    // Add to front with timestamp
    const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getRecentlyViewedIds(): string[] {
  return getRecentlyViewed().map((item) => item.id);
}
