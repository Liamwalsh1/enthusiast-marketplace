import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Get total count of active listings
  const { count } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const total = count ?? 0;

  if (total === 0) {
    return NextResponse.json({ listings: [] });
  }

  // Pick a random offset, ensuring we can get 3 listings
  const maxOffset = Math.max(0, total - 3);
  const offset = Math.floor(Math.random() * (maxOffset + 1));

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, category, price_eur, location, condition, image_urls, blur_data_urls, make, model, year, mileage_km, transmission, wheel_brand, wheel_diameter")
    .eq("status", "active")
    .range(offset, offset + 2);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listings: data ?? [] });
}
