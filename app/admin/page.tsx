import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // Check if user is admin
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    redirect("/");
  }

  // Get counts for dashboard
  const [
    { count: pendingCount },
    { count: activeCount },
    { count: rejectedCount },
    { count: flaggedCount },
    { count: userCount },
    { count: waitlistCount },
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("comment_flags").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase.from("waitlist").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="container">
      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0" }}>
        Admin Dashboard
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Pending Listings"
          value={pendingCount ?? 0}
          highlight={(pendingCount ?? 0) > 0 ? "warning" : undefined}
        />
        <StatCard label="Active Listings" value={activeCount ?? 0} />
        <StatCard
          label="Flagged Comments"
          value={flaggedCount ?? 0}
          highlight={(flaggedCount ?? 0) > 0 ? "error" : undefined}
        />
        <StatCard label="Total Users" value={userCount ?? 0} />
        <StatCard label="Waitlist Signups" value={waitlistCount ?? 0} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <DashboardSection
          title="Listings"
          description="Review and manage marketplace listings"
          links={[
            { label: `Review Pending (${pendingCount ?? 0})`, href: "/admin/pending", primary: (pendingCount ?? 0) > 0 },
            { label: "All Listings", href: "/admin/listings" },
          ]}
        />
        <DashboardSection
          title="Content Moderation"
          description="Handle flagged comments and content"
          links={[
            { label: `Flagged Content (${flaggedCount ?? 0})`, href: "/admin/flagged", primary: (flaggedCount ?? 0) > 0 },
          ]}
        />
        <DashboardSection
          title="User Management"
          description="View users, assign roles, and manage accounts"
          links={[
            { label: `All Users (${userCount})`, href: "/admin/users" },
          ]}
        />
        <DashboardSection
          title="Waitlist"
          description="People who signed up to be notified about new listings"
          links={[
            { label: `View Waitlist (${waitlistCount ?? 0})`, href: "/admin/waitlist" },
          ]}
        />
        <DashboardSection
          title="Statistics"
          description="Overview of marketplace activity"
          stats={[
            { label: "Active", value: activeCount ?? 0 },
            { label: "Pending", value: pendingCount ?? 0 },
            { label: "Rejected", value: rejectedCount ?? 0 },
          ]}
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "warning" | "error";
}) {
  let borderColor = "var(--border)";
  let bgColor = "white";
  let textColor = "var(--green-900)";

  if (highlight === "warning") {
    borderColor = "rgba(234,179,8,0.4)";
    bgColor = "rgba(234,179,8,0.08)";
    textColor = "rgba(161,98,7,1)";
  } else if (highlight === "error") {
    borderColor = "rgba(220,38,38,0.4)";
    bgColor = "rgba(220,38,38,0.08)";
    textColor = "rgba(153,27,27,1)";
  }

  return (
    <div
      className="card"
      style={{
        padding: 20,
        textAlign: "center",
        border: `1px solid ${borderColor}`,
        background: bgColor,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 900, color: textColor }}>{value}</div>
      <div style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13 }}>{label}</div>
    </div>
  );
}

function DashboardSection({
  title,
  description,
  links,
  stats,
}: {
  title: string;
  description: string;
  links?: { label: string; href: string; primary?: boolean }[];
  stats?: { label: string; value: number }[];
}) {
  return (
    <section className="card" style={{ padding: 20 }}>
      <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 18, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13, marginBottom: 16 }}>
        {description}
      </div>
      {links && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {links.map((link) => (
            <Link
              key={link.href}
              className={link.primary ? "btn btn-primary" : "btn btn-secondary"}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
      {stats && (
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--green-900)" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 650 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
