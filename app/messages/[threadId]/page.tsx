import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import MessageComposer from "@/app/components/MessageComposer";
import MarkThreadRead from "@/app/components/MarkThreadRead";

type ThreadRecord = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  listings: { title: string | null } | { title: string | null }[] | null;
};

type UserProfile = {
  user_id: string;
  display_name: string | null;
};

function getDisplayName(profile: UserProfile | null, fallback: string): string {
  if (profile?.display_name) return profile.display_name;
  return fallback;
}

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/messages/${threadId}`)}`);
  }

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id, listing_id, buyer_id, seller_id, listings ( title )")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError || !thread) {
    notFound();
  }

  const threadRecord = thread as ThreadRecord;

  const isParticipant = threadRecord.buyer_id === user.id || threadRecord.seller_id === user.id;
  if (!isParticipant) {
    notFound();
  }

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  const messages = messageRows ?? [];

  // Get the other user's profile
  const isBuyer = threadRecord.buyer_id === user.id;
  const otherUserId = isBuyer ? threadRecord.seller_id : threadRecord.buyer_id;

  const { data: otherProfile } = await supabase
    .from("user_profiles")
    .select("user_id, display_name")
    .eq("user_id", otherUserId)
    .maybeSingle();

  const otherName = getDisplayName(otherProfile as UserProfile | null, isBuyer ? "seller" : "buyer");
  const listingsValue = threadRecord.listings;
  const listingTitle = Array.isArray(listingsValue)
    ? listingsValue[0]?.title ?? null
    : listingsValue?.title ?? null;

  return (
    <main className="container">
      <MarkThreadRead threadId={threadId} />
      <Link className="pill" href="/messages">
        ← Back to inbox
      </Link>
      <section className="card" style={{ padding: 20, marginTop: 12, display: "grid", gap: 16 }}>
        <div>
          <Link
            href={`/listings/${threadRecord.listing_id}`}
            style={{
              fontWeight: 900,
              color: "var(--green-900)",
              fontSize: 28,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {listingTitle ?? "Conversation"}
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green-600)" }}>
              View listing →
            </span>
          </Link>
          <div style={{ color: "var(--muted)", fontWeight: 650, marginTop: 4 }}>
            Chatting with{" "}
            <Link
              href={`/sellers/${otherUserId}`}
              style={{
                color: "var(--green-900)",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {otherName}
            </Link>
            <Link
              href={`/sellers/${otherUserId}`}
              style={{
                marginLeft: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--green-600)",
                textDecoration: "none",
              }}
            >
              View profile →
            </Link>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 12,
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--soft)",
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: "var(--muted)", fontWeight: 650 }}>No messages yet. Say hello!</div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  style={{
                    justifySelf: isMine ? "end" : "start",
                    background: isMine ? "var(--green-900)" : "white",
                    color: isMine ? "white" : "var(--text)",
                    padding: 12,
                    borderRadius: 14,
                    maxWidth: "80%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                    {new Date(message.created_at).toLocaleString("en-IE")}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontWeight: 650 }}>{message.body}</div>
                </div>
              );
            })
          )}
        </div>
        <MessageComposer threadId={threadId} />
      </section>
    </main>
  );
}
