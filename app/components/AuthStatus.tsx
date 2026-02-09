"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  initialUserEmail: string | null;
};

export default function AuthStatus({ initialUserEmail }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const refreshGuard = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const fetchAlertCount = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts/matches?unread=true");
      if (res.ok) {
        const data = await res.json();
        setAlertCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch alert count:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data.user ?? null);
      setHydrated(true);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        if (refreshGuard.current) return;
        refreshGuard.current = true;
        router.refresh();
        setTimeout(() => {
          refreshGuard.current = false;
        }, 500);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch unread count when user is available and poll periodically
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setAlertCount(0);
      return;
    }

    fetchUnreadCount();
    fetchAlertCount();

    // Poll every 30 seconds for new messages and alerts
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchAlertCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount, fetchAlertCount]);

  const effectiveUser = hydrated ? user : null;
  const email = effectiveUser?.email ?? initialUserEmail;

  async function handleLogout() {
    await fetch("/logout", { method: "POST" });
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  }

  if (!email) {
    return (
      <Link className="btn btn-secondary" href="/login">
        Sign in
      </Link>
    );
  }

  return (
    <>
      <span style={{ color: "var(--muted)", fontWeight: 650 }}>Signed in as {email}</span>
      <Link className="btn btn-secondary" href="/messages" style={badgeLinkStyle}>
        Messages
        {unreadCount > 0 && (
          <span style={unreadBadgeStyle}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
      <Link className="btn btn-secondary" href="/account/alerts" style={badgeLinkStyle}>
        Alerts
        {alertCount > 0 && (
          <span style={alertBadgeStyle}>
            {alertCount > 99 ? "99+" : alertCount}
          </span>
        )}
      </Link>
      <Link className="btn btn-secondary" href="/account">
        Account
      </Link>
      <button className="btn btn-primary" type="button" onClick={handleLogout}>
        Log out
      </button>
    </>
  );
}

const badgeLinkStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const unreadBadgeStyle: CSSProperties = {
  background: "rgba(220,38,38,0.95)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
  padding: "2px 6px",
  borderRadius: 999,
  minWidth: 18,
  textAlign: "center",
  lineHeight: 1.2,
};

const alertBadgeStyle: CSSProperties = {
  background: "var(--green-900)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
  padding: "2px 6px",
  borderRadius: 999,
  minWidth: 18,
  textAlign: "center",
  lineHeight: 1.2,
};
