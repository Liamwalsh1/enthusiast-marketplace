export type Comment = {
  id: string;
  listing_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_email?: string;
  display_name?: string | null;
};

export type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
  is_seller: boolean;
};

export type CommentFlag = {
  id: string;
  comment_id: string;
  flagged_by: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: "user" | "admin";
  created_at: string;
};
