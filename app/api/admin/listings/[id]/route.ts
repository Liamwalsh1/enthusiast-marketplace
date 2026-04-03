import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Delete related records first to avoid foreign key constraint errors
  await Promise.all([
    supabase.from("saved_listings").delete().eq("listing_id", id),
    supabase.from("listing_views").delete().eq("listing_id", id),
    supabase.from("comments").delete().eq("listing_id", id),
    supabase.from("reviews").delete().eq("listing_id", id),
  ]);

  // Delete message threads and their messages
  const { data: threads } = await supabase
    .from("message_threads")
    .select("id")
    .eq("listing_id", id);

  if (threads && threads.length > 0) {
    const threadIds = threads.map((t) => t.id);
    await supabase.from("messages").delete().in("thread_id", threadIds);
    await supabase.from("message_threads").delete().in("id", threadIds);
  }

  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
