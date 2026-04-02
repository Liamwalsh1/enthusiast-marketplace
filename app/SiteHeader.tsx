import Link from "next/link";
import { createServerSupabaseClient } from "./lib/supabase/server";
import AuthStatus from "./components/AuthStatus";
import SellDropdown from "./components/SellDropdown";
import BrowseDropdown from "./components/BrowseDropdown";

export const dynamic = "force-dynamic";

export default async function SiteHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="site-header-wrap">
      <div className="site-header-inner">
        {/* Left: Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img src="/logo.png" alt="Passion Driven" className="site-logo" />
        </Link>

        {/* Center: Main Navigation */}
        <nav className="site-main-nav">
          <BrowseDropdown />
          <SellDropdown />
        </nav>

        {/* Right: Auth & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AuthStatus initialUserEmail={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
