import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// GET - Get a single alert
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: alert, error } = await supabase
    .from("search_alerts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ alert });
}

// PATCH - Update an alert
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    category?: string | null;
    make?: string | null;
    model?: string | null;
    year_min?: number | null;
    year_max?: number | null;
    price_min?: number | null;
    price_max?: number | null;
    location?: string | null;
    transmission?: string | null;
    is_active?: boolean;
    email_notifications?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate category if provided
  const validCategories = ["car", "wheels"];
  if (body.category && !validCategories.includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name.trim().slice(0, 100);
  if (body.category !== undefined) updates.category = body.category || null;
  if (body.make !== undefined) updates.make = body.make?.trim() || null;
  if (body.model !== undefined) updates.model = body.model?.trim() || null;
  if (body.year_min !== undefined) updates.year_min = body.year_min;
  if (body.year_max !== undefined) updates.year_max = body.year_max;
  if (body.price_min !== undefined) updates.price_min = body.price_min;
  if (body.price_max !== undefined) updates.price_max = body.price_max;
  if (body.location !== undefined) updates.location = body.location?.trim() || null;
  if (body.transmission !== undefined) updates.transmission = body.transmission?.trim() || null;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.email_notifications !== undefined) updates.email_notifications = body.email_notifications;

  const { data: alert, error } = await supabase
    .from("search_alerts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ alert });
}

// DELETE - Delete an alert
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("search_alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
