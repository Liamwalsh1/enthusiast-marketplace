"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  initialUserEmail: string | null;
};

export default function AuthStatus({ initialUserEmail }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const refreshGuard = useRef(false);

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
      <Link className="btn btn-secondary" href="/account">
        Account
      </Link>
      <button className="btn btn-primary" type="button" onClick={handleLogout}>
        Log out
      </button>
    </>
  );
}
