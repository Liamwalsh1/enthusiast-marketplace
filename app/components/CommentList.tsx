"use client";

import CommentThread from "./CommentThread";
import type { CommentWithReplies } from "@/app/types/comments";

type Props = {
  comments: CommentWithReplies[];
  listingId: string;
  currentUserId: string | null;
};

const MAX_DEPTH = 5;

export default function CommentList({ comments, listingId, currentUserId }: Props) {
  if (comments.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: "var(--muted)",
          fontWeight: 650,
        }}
      >
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {comments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          listingId={listingId}
          currentUserId={currentUserId}
          depth={0}
          maxDepth={MAX_DEPTH}
        />
      ))}
    </div>
  );
}
