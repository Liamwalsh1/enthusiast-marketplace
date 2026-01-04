"use client";

import { supabase } from "@/app/lib/supabaseClient";

export async function ensureServerSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token || !session?.refresh_token) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("ensureServerSession: no session available");
      }
      return false;
    }

    const res = await fetch("/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });

    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("ensureServerSession: bridge failed", await res.text());
      }
      return false;
    }

    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("ensureServerSession: error", error);
    }
    return false;
  }
}
