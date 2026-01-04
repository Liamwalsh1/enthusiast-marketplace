import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

type ThreadRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listings: { title: string | null } | { title: string | null }[] | null;
};

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
            const talkingTo = isBuyer ? "Seller" : "Buyer";
            const listingsValue = thread.listings;
            const listingTitle = Array.isArray(listingsValue)
              ? listingsValue[0]?.title ?? "Untitled listing"
              : listingsValue?.title ?? "Untitled listing";
            return (
              <div key={thread.id} className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900, color: "var(--green-900)" }}>{listingTitle}</div>
                <div style={{ color: "var(--muted)", fontWeight: 650 }}>
                  Talking with: <strong>{talkingTo}</strong>
                </div>
                <Link className="btn btn-secondary" href={`/messages/${thread.id}`}>
                  View conversation
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
