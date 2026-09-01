import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// GET - List all alerts for current user
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: alerts, error } = await supabase
    .from("search_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts });
}

// POST - Create a new alert
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    category?: string;
    make?: string;
    model?: string;
    year_min?: number;
    year_max?: number;
    price_min?: number;
    price_max?: number;
    location?: string;
    transmission?: string;
    email_notifications?: boolean;
    // Extended filters
    mileage_min?: number;
    mileage_max?: number;
    wheel_brand?: string;
    wheel_diameter?: number;
    bolt_pattern?: string;
    search_text?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim().slice(0, 100);

  if (!name) {
    return NextResponse.json({ error: "Alert name is required" }, { status: 400 });
  }

  // Validate category if provided
  const validCategories = ["car", "wheels"];
  if (body.category && !validCategories.includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { data: alert, error } = await supabase
    .from("search_alerts")
    .insert({
      user_id: user.id,
      name,
      category: body.category || null,
      make: body.make?.trim() || null,
      model: body.model?.trim() || null,
      year_min: body.year_min || null,
      year_max: body.year_max || null,
      price_min: body.price_min || null,
      price_max: body.price_max || null,
      location: body.location?.trim() || null,
      transmission: body.transmission?.trim() || null,
      email_notifications: body.email_notifications ?? true,
      // Extended filters
      mileage_min: body.mileage_min || null,
      mileage_max: body.mileage_max || null,
      wheel_brand: body.wheel_brand?.trim() || null,
      wheel_diameter: body.wheel_diameter || null,
      bolt_pattern: body.bolt_pattern?.trim() || null,
      search_text: body.search_text?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert }, { status: 201 });
}
