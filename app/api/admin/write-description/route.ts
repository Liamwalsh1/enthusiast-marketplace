import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { sendDescriptionReadyEmail } from "@/app/lib/email";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { listingId, description } = await request.json();

  if (!listingId || !description?.trim()) {
    return NextResponse.json({ error: "listingId and description are required" }, { status: 400 });
  }

  // Update listing
  const { data: listing, error: updateError } = await supabase
    .from("listings")
    .update({
      description: description.trim(),
      pd_written: true,
      description_written_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", listingId)
    .select("title, owner_id")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Fetch seller email & name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", listing.owner_id)
    .maybeSingle();

  const { data: authUser } = await supabase.auth.admin.getUserById(listing.owner_id);
  const sellerEmail = authUser?.user?.email;
  const sellerName = profile?.display_name || sellerEmail?.split("@")[0] || "there";

  if (sellerEmail) {
    await sendDescriptionReadyEmail({
      toEmail: sellerEmail,
      toName: sellerName,
      listingTitle: listing.title,
      listingId,
    });
  }

  return NextResponse.json({ ok: true });
}
