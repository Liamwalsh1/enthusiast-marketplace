import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import type { Comment, CommentWithReplies } from "@/app/types/comments";

type Props = {
  listingId: string;
  sellerId: string | null;
};

function buildCommentTree(
  comments: Comment[],
  sellerId: string | null
): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
      is_seller: comment.user_id === sellerId,
    });
  }

  for (const comment of comments) {
    const node = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(node);
    } else {
      rootComments.push(node);
    }
  }

  return rootComments;
}

export default async function CommentSection({ listingId, sellerId }: Props) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try to use the function that joins user emails
  // Falls back to direct query if function doesn't exist yet
  let comments: Comment[] = [];
  let fetchError = null;

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_comments_with_users",
    { p_listing_id: listingId }
  );

  if (rpcError) {
    // Function might not exist yet - fall back to direct query
    const { data: directData, error: directError } = await supabase
      .from("comments")
      .select("id, listing_id, user_id, parent_id, body, is_deleted, created_at, updated_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true });

    if (directError) {
      fetchError = directError;
    } else {
      comments = (directData ?? []) as Comment[];
    }
  } else {
    comments = (rpcData ?? []) as Comment[];
  }

  if (fetchError) {
    // Check if it's because the table doesn't exist yet
    const isTableMissing =
      fetchError.message?.toLowerCase().includes("does not exist") ||
      fetchError.code === "42P01";

    if (isTableMissing) {
      return (
        <section className="card" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)", fontSize: 20 }}>
            Comments
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: 12,
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)",
              color: "rgba(161,98,7,1)",
              fontWeight: 650,
            }}
          >
            Comments feature requires database setup. Run the migration in{" "}
            <code>supabase/sql/add_comments.sql</code>
          </div>
        </section>
      );
    }

    console.error("Failed to fetch comments:", fetchError);
    return (
      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ color: "var(--muted)", fontWeight: 650 }}>
          Unable to load comments.
        </div>
      </section>
    );
  }

  const commentTree = buildCommentTree(comments, sellerId);
  const commentCount = comments.filter((c) => !c.is_deleted).length;

  return (
    <section className="card" style={{ padding: 16, marginTop: 16 }}>
      <div
        style={{
          fontWeight: 950,
          color: "var(--green-900)",
          fontSize: 20,
          marginBottom: 16,
        }}
      >
        Comments ({commentCount})
      </div>

      <CommentForm
        listingId={listingId}
        parentId={null}
        placeholder="Join the discussion..."
        isLoggedIn={!!user}
      />

      <CommentList
        comments={commentTree}
        listingId={listingId}
        currentUserId={user?.id ?? null}
      />
    </section>
  );
}
