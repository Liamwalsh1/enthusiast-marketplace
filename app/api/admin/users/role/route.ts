import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if current user is admin
  const { data: currentRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentRole?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse request
  let body: { userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, role } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!role || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "role must be 'user' or 'admin'" }, { status: 400 });
  }

  // Prevent admin from removing their own admin role
  if (userId === user.id && role !== "admin") {
    return NextResponse.json({ error: "Cannot remove your own admin role" }, { status: 400 });
  }

  // Upsert the role
  const { error: upsertError } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: userId, role },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("Failed to update user role:", upsertError);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId, role });
}
