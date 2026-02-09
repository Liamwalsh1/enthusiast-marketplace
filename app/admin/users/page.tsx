import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import AdminUserRow from "@/app/components/AdminUserRow";

type UserRow = {
  user_id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  location: string | null;
  role: string;
  listing_count: number;
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/users");
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

  // Fetch user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, location, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Failed to fetch user profiles:", profilesError);
  }

  const profileList = profiles ?? [];

  // Fetch roles for all users
  const userIds = profileList.map((p) => p.user_id);
  const { data: roles } = userIds.length > 0
    ? await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds)
    : { data: [] };

  const roleMap = new Map<string, string>();
  (roles ?? []).forEach((r) => {
    roleMap.set(r.user_id, r.role);
  });

  // Count listings per user
  const { data: listingCounts } = await supabase
    .from("listings")
    .select("owner_id");

  const listingCountMap = new Map<string, number>();
  (listingCounts ?? []).forEach((l) => {
    const current = listingCountMap.get(l.owner_id) ?? 0;
    listingCountMap.set(l.owner_id, current + 1);
  });

  // Build user list
  const userList: UserRow[] = profileList.map((p) => ({
    user_id: p.user_id,
    email: "", // We don't have access to auth.users email without the RPC function
    created_at: p.created_at,
    display_name: p.display_name,
    location: p.location,
    role: roleMap.get(p.user_id) ?? "user",
    listing_count: listingCountMap.get(p.user_id) ?? 0,
  }));

  // Count stats
  const totalUsers = userList.length;
  const adminCount = userList.filter((u) => u.role === "admin").length;
  const usersWithListings = userList.filter((u) => u.listing_count > 0).length;

  return (
    <main className="container">
      <Link className="pill" href="/admin">← Back to dashboard</Link>

      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0" }}>
        User Management
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--green-900)" }}>{totalUsers}</div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>Total Users</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--green-900)" }}>{adminCount}</div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>Admins</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--green-900)" }}>{usersWithListings}</div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>Sellers</div>
        </div>
      </div>

      {userList.length === 0 ? (
        <section className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>No users found</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            This shouldn&apos;t happen - check the database function.
          </p>
        </section>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--soft)", borderBottom: "1px solid var(--border)" }}>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Listings</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Joined</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((u) => (
                <AdminUserRow key={u.user_id} user={u} currentUserId={user.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  color: "var(--muted)",
};
