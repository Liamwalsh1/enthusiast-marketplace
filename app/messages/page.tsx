import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

type ThreadRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listings: { title: string | null } | { title: string | null }[] | null;
};

type UserProfile = {
  user_id: string;
  display_name: string | null;
};

type ReadStatus = {
  thread_id: string;
  last_read_at: string;
};

function getDisplayName(profile: UserProfile | null, fallback: string): string {
  if (profile?.display_name) return profile.display_name;
  return fallback;
}

export default async function MessagesInboxPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: threadRows } = await supabase
    .from("threads")
    .select("id, listing_id, buyer_id, seller_id, last_message_at, listings ( title )")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });
  const threads: ThreadRow[] = threadRows ?? [];

  // Get all unique user IDs we need to look up (the other person in each thread)
  const otherUserIds = threads.map((t) => (t.buyer_id === user.id ? t.seller_id : t.buyer_id));
  const uniqueUserIds = [...new Set(otherUserIds)];

  // Fetch profiles for all other users
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name")
    .in("user_id", uniqueUserIds);

  const profileMap = new Map<string, UserProfile>();
  (profiles ?? []).forEach((p) => profileMap.set(p.user_id, p as UserProfile));

  // Fetch read status for all threads
  const threadIds = threads.map((t) => t.id);
  const { data: readStatuses } = await supabase
    .from("thread_read_status")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id)
    .in("thread_id", threadIds);

  const readMap = new Map<string, string>();
  (readStatuses as ReadStatus[] ?? []).forEach((rs) => {
    readMap.set(rs.thread_id, rs.last_read_at);
  });

  // Determine which threads have unread messages
  // A thread is unread if there are messages from the other person after the user's last_read_at
  const unreadThreadIds = new Set<string>();

  for (const thread of threads) {
    const lastReadAt = readMap.get(thread.id);

    if (!lastReadAt) {
      // Never read this thread - check if there are any messages from the other person
      const { data: otherMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("thread_id", thread.id)
        .neq("sender_id", user.id)
        .limit(1);

      if (otherMessages && otherMessages.length > 0) {
        unreadThreadIds.add(thread.id);
      }
    } else {
      // Check if there are messages from the other person after last_read_at
      const { data: newMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("thread_id", thread.id)
        .neq("sender_id", user.id)
        .gt("created_at", lastReadAt)
        .limit(1);

      if (newMessages && newMessages.length > 0) {
        unreadThreadIds.add(thread.id);
      }
    }
  }

  return (
    <main className="container">
      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0" }}>Inbox</h1>
      {threads.length === 0 ? (
        <section className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>No conversations yet</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            Start messaging sellers from a listing page.
          </p>
          <Link className="btn btn-primary" href="/browse">
            Browse listings
          </Link>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {threads.map((thread) => {
            const isBuyer = thread.buyer_id === user.id;
            const otherUserId = isBuyer ? thread.seller_id : thread.buyer_id;
            const otherProfile = profileMap.get(otherUserId) ?? null;
            const otherName = getDisplayName(otherProfile, isBuyer ? "Seller" : "Buyer");
            const listingsValue = thread.listings;
            const listingTitle = Array.isArray(listingsValue)
              ? listingsValue[0]?.title ?? "Untitled listing"
              : listingsValue?.title ?? "Untitled listing";
            const isUnread = unreadThreadIds.has(thread.id);
            return (
              <div
                key={thread.id}
                className="card"
                style={{
                  padding: 16,
                  display: "grid",
                  gap: 8,
                  borderLeft: isUnread ? "4px solid var(--green-900)" : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    href={`/listings/${thread.listing_id}`}
                    style={{ fontWeight: 900, color: "var(--green-900)", textDecoration: "none" }}
                  >
                    {listingTitle}
                  </Link>
                  {isUnread && <span style={unreadBadgeStyle}>New</span>}
                </div>
                <div style={{ color: "var(--muted)", fontWeight: 650 }}>
                  Talking with:{" "}
                  <Link
                    href={`/sellers/${otherUserId}`}
                    style={{ color: "var(--green-900)", fontWeight: 800, textDecoration: "none" }}
                  >
                    {otherName}
                  </Link>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {formatRelativeTime(thread.last_message_at)}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="btn btn-secondary" href={`/messages/${thread.id}`}>
                    View conversation
                  </Link>
                  <Link
                    href={`/listings/${thread.listing_id}`}
                    style={quickLinkStyle}
                  >
                    View listing
                  </Link>
                  <Link
                    href={`/sellers/${otherUserId}`}
                    style={quickLinkStyle}
                  >
                    View profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IE", { month: "short", day: "numeric" });
}

const unreadBadgeStyle: CSSProperties = {
  background: "var(--green-900)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
  padding: "2px 8px",
  borderRadius: 999,
};

const quickLinkStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--green-600)",
  textDecoration: "none",
  padding: "8px 0",
};
