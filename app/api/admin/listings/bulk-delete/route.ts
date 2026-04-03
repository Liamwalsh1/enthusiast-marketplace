import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const ids: string[] = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  // Delete related records first to avoid foreign key constraint errors
  await Promise.all([
    supabase.from("saved_listings").delete().in("listing_id", ids),
    supabase.from("listing_views").delete().in("listing_id", ids),
    supabase.from("comments").delete().in("listing_id", ids),
    supabase.from("reviews").delete().in("listing_id", ids),
  ]);

  // Delete message threads and their messages
  const { data: threads } = await supabase
    .from("message_threads")
    .select("id")
    .in("listing_id", ids);

  if (threads && threads.length > 0) {
    const threadIds = threads.map((t) => t.id);
    await supabase.from("messages").delete().in("thread_id", threadIds);
    await supabase.from("message_threads").delete().in("id", threadIds);
  }

  const { error } = await supabase.from("listings").delete().in("id", ids);

  if (error) {
    console.error("Failed to bulk delete listings:", error);
    return NextResponse.json({ error: "Failed to delete listings" }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
