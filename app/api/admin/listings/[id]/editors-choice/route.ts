import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

async function checkAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

// Set a listing as editor's choice (clears any existing pick first)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const auth = await checkAdmin(supabase);

  if ("error" in auth) return auth.error;

  // Clear any existing editor's choice
  await supabase
    .from("listings")
    .update({ editors_choice: false })
    .eq("editors_choice", true);

  // Set this listing
  const { error } = await supabase
    .from("listings")
    .update({ editors_choice: true })
    .eq("id", id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Remove editor's choice from a listing
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const auth = await checkAdmin(supabase);

  if ("error" in auth) return auth.error;

  const { error } = await supabase
    .from("listings")
    .update({ editors_choice: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
