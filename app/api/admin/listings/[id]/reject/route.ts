import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(
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

  // Check if user is admin
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse request body for rejection reason
  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reason = body.reason?.trim();
  if (!reason) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  // Update listing to rejected
  const { error } = await supabase
    .from("listings")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id)
    .in("status", ["pending", "active"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
