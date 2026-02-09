import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
    return NextResponse.json({ error: "Provide 1-50 listing IDs" }, { status: 400 });
  }

  // Delete only listings owned by this user
  const { error } = await supabase
    .from("listings")
    .delete()
    .in("id", ids)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Bulk delete error:", error.message);
    return NextResponse.json({ error: "Failed to delete listings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
