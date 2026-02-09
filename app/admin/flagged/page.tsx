import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import FlaggedCommentCard from "@/app/components/FlaggedCommentCard";

type FlaggedComment = {
  flag_id: string;
  comment_id: string;
  comment_body: string;
  comment_user_id: string;
  comment_user_email: string;
  comment_is_deleted: boolean;
  listing_id: string;
  listing_title: string;
  flag_reason: string;
  flag_status: string;
  flagged_by: string;
  flagger_email: string;
  flagged_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminFlaggedPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/flagged");
  }

  // Check if user is admin
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    redirect("/");
  }

  // Fetch pending flags with comment details
  const { data: flags, error: flagsError } = await supabase
    .from("comment_flags")
    .select("id, comment_id, reason, status, flagged_by, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (flagsError) {
    console.error("Failed to fetch flags:", flagsError);
  }

  const flagList = flags ?? [];

  // Fetch comments for those flags
  const commentIds = [...new Set(flagList.map((f) => f.comment_id))];
  const { data: comments } = commentIds.length > 0
    ? await supabase
        .from("comments")
        .select("id, body, user_id, is_deleted, listing_id")
        .in("id", commentIds)
    : { data: [] };

  const commentMap = new Map<string, { body: string; user_id: string; is_deleted: boolean; listing_id: string }>();
  (comments ?? []).forEach((c) => {
    commentMap.set(c.id, { body: c.body, user_id: c.user_id, is_deleted: c.is_deleted, listing_id: c.listing_id });
  });

  // Fetch listings for those comments
  const listingIds = [...new Set((comments ?? []).map((c) => c.listing_id))];
  const { data: listings } = listingIds.length > 0
    ? await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds)
    : { data: [] };

  const listingMap = new Map<string, string>();
  (listings ?? []).forEach((l) => {
    listingMap.set(l.id, l.title ?? "Untitled");
  });

  // Fetch user profiles for comment authors and flaggers
  const userIds = [
    ...new Set([
      ...flagList.map((f) => f.flagged_by),
      ...(comments ?? []).map((c) => c.user_id),
    ]),
  ];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = new Map<string, string>();
  (profiles ?? []).forEach((p) => {
    if (p.display_name) profileMap.set(p.user_id, p.display_name);
  });

  // Build the flagged comments list
  const flaggedComments: FlaggedComment[] = flagList.map((f) => {
    const comment = commentMap.get(f.comment_id);
    const listingTitle = comment ? listingMap.get(comment.listing_id) ?? "Unknown" : "Unknown";
    return {
      flag_id: f.id,
      comment_id: f.comment_id,
      comment_body: comment?.body ?? "",
      comment_user_id: comment?.user_id ?? "",
      comment_user_email: profileMap.get(comment?.user_id ?? "") ?? "Unknown user",
      comment_is_deleted: comment?.is_deleted ?? false,
      listing_id: comment?.listing_id ?? "",
      listing_title: listingTitle,
      flag_reason: f.reason,
      flag_status: f.status,
      flagged_by: f.flagged_by,
      flagger_email: profileMap.get(f.flagged_by) ?? "Unknown user",
      flagged_at: f.created_at,
    };
  });

  // Get total pending count
  const { count: pendingCount } = await supabase
    .from("comment_flags")
    .select("id", { head: true, count: "exact" })
    .eq("status", "pending");

  return (
    <main className="container">
      <Link className="pill" href="/admin">← Back to dashboard</Link>

      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0" }}>
        Flagged Content
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
        <div
          className="card"
          style={{
            padding: 16,
            textAlign: "center",
            background: (pendingCount ?? 0) > 0 ? "rgba(234,179,8,0.08)" : undefined,
            border: (pendingCount ?? 0) > 0 ? "1px solid rgba(234,179,8,0.3)" : undefined,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: (pendingCount ?? 0) > 0 ? "rgba(161,98,7,1)" : "var(--green-900)",
            }}
          >
            {pendingCount ?? 0}
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>Pending Flags</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--green-900)" }}>
            {flaggedComments.filter((f) => !f.comment_is_deleted).length}
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>Active Comments</div>
        </div>
      </div>

      {flaggedComments.length === 0 ? (
        <section className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>All caught up!</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            No flagged content to review.
          </p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {flaggedComments.map((flag) => (
            <FlaggedCommentCard key={flag.flag_id} flag={flag} adminId={user.id} />
          ))}
        </div>
      )}
    </main>
  );
}
