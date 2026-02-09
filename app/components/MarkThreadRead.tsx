"use client";

import { useEffect } from "react";

type Props = {
  threadId: string;
};

export default function MarkThreadRead({ threadId }: Props) {
  useEffect(() => {
    // Mark thread as read when component mounts
    async function markAsRead() {
      try {
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId }),
        });
      } catch (err) {
        console.error("Failed to mark thread as read:", err);
      }
    }

    markAsRead();
  }, [threadId]);

  // This component doesn't render anything visible
  return null;
}
