import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id, user_id, display_name, bio, location, social_link, phone, avatar_url, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile, email: user.email });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    display_name?: string;
    bio?: string;
    location?: string;
    social_link?: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate fields
  const displayName = body.display_name?.trim().slice(0, 100) || null;
  const bio = body.bio?.trim().slice(0, 500) || null;
  const location = body.location?.trim().slice(0, 100) || null;
  const socialLink = body.social_link?.trim().slice(0, 200) || null;
  const phone = body.phone?.trim().slice(0, 20) || null;

  // Check if profile exists
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Update existing profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName,
        bio,
        location,
        social_link: socialLink,
        phone,
      })
      .eq("user_id", user.id)
      .select("id, user_id, display_name, bio, location, social_link, phone, avatar_url, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } else {
    // Create new profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        display_name: displayName,
        bio,
        location,
        social_link: socialLink,
        phone,
      })
      .select("id, user_id, display_name, bio, location, social_link, phone, avatar_url, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile }, { status: 201 });
  }
}
