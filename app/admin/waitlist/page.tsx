import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/waitlist");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") redirect("/");

  const { data: entries } = await supabase
    .from("waitlist")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: false });

  const list = entries ?? [];

  return (
    <main className="container">
      <Link className="pill" href="/admin">← Back to dashboard</Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 20px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)" }}>
          Waitlist
        </h1>
        <div style={{ fontWeight: 700, color: "var(--muted)", fontSize: 15 }}>
          {list.length} {list.length === 1 ? "signup" : "signups"}
        </div>
      </div>

      {list.length === 0 ? (
        <section className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>No signups yet</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            The waitlist section on the homepage will collect emails here.
          </p>
        </section>
      ) : (
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--soft)" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {list.map((entry, i) => (
                <tr
                  key={entry.id}
                  style={{ borderBottom: i < list.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <td style={tdStyle}>{entry.name || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td style={tdStyle}>
                    <a href={`mailto:${entry.email}`} style={{ color: "var(--green-900)", fontWeight: 700, textDecoration: "none" }}>
                      {entry.email}
                    </a>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--muted)" }}>
                    {new Date(entry.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 800,
  color: "var(--green-900)",
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontWeight: 650,
  color: "var(--text)",
};
