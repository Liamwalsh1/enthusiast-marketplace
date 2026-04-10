"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  initialUserEmail: string | null;
};

export default function AuthStatus({ initialUserEmail }: Props) {
  const router = useRouter();
  const pathname = usePathname();
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
      if (event === "SIGNED_IN") {
        if (refreshGuard.current) return;
        if (pathname === "/login") return;
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

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setAlertCount(0);
      return;
    }

    fetchUnreadCount();
    fetchAlertCount();

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
      <Link href="/login" className="auth-signin-btn">
        Sign in
      </Link>
    );
  }

  return (
    <div className="auth-container">
      {/* Icon buttons for Messages, Alerts, Account */}
      <Link href="/messages" className="auth-icon-btn" title="Messages">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </Link>

      <Link href="/account/alerts" className="auth-icon-btn" title="Alerts">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {alertCount > 0 && (
          <span style={styles.badgeGreen}>{alertCount > 99 ? "99+" : alertCount}</span>
        )}
      </Link>

      <Link href="/account" className="auth-icon-btn" title="Account">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>

      {/* Divider */}
      <div className="auth-divider" />

      {/* Logout button */}
      <button type="button" onClick={handleLogout} className="auth-logout-btn">
        Log out
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    padding: "0 5px",
    borderRadius: 9,
    background: "#dc2626",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  badgeGreen: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    padding: "0 5px",
    borderRadius: 9,
    background: "#0b2f1a",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
};
