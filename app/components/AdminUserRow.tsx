"use client";

import { useState } from "react";

type UserData = {
  user_id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  location: string | null;
  role: string;
  listing_count: number;
};

type Props = {
  user: UserData;
  currentUserId: string;
};

export default function AdminUserRow({ user, currentUserId }: Props) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentUser = user.user_id === currentUserId;

  async function handleRoleChange(newRole: string) {
    if (newRole === role) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      setRole(newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={tdStyle}>
        <div style={{ fontWeight: 700, color: "var(--green-900)" }}>
          {user.display_name || "No display name"}
        </div>
        {user.email && (
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            {user.email}
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, fontFamily: "monospace" }}>
          {user.user_id.slice(0, 8)}...
        </div>
      </td>
      <td style={tdStyle}>
        <span style={{ color: "var(--text)", fontWeight: 650 }}>
          {user.location || "—"}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontWeight: 700, color: "var(--green-900)" }}>
          {user.listing_count}
        </span>
      </td>
      <td style={tdStyle}>
        {isCurrentUser ? (
          <span
            className="pill"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "rgba(22,101,52,1)",
              fontWeight: 700,
            }}
          >
            {role === "admin" ? "Admin (You)" : "User (You)"}
          </span>
        ) : (
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--soft)",
              fontWeight: 650,
              fontSize: 13,
              color: "var(--green-900)",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {error && (
          <div style={{ fontSize: 11, color: "rgba(220,38,38,1)", marginTop: 4, fontWeight: 600 }}>
            {error}
          </div>
        )}
      </td>
      <td style={tdStyle}>
        <span style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13 }}>
          {formatDate(user.created_at)}
        </span>
      </td>
      <td style={tdStyle}>
        <a
          href={`/profile/${user.user_id}`}
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          View Profile
        </a>
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
