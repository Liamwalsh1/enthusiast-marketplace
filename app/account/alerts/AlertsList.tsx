"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";
import type { SearchAlert, AlertMatchCount } from "./page";

type Props = {
  alerts: SearchAlert[];
  matchCounts: AlertMatchCount[];
};

function formatCriteria(alert: SearchAlert): string[] {
  const criteria: string[] = [];

  if (alert.category) {
    criteria.push(alert.category.charAt(0).toUpperCase() + alert.category.slice(1));
  }
  if (alert.make) {
    criteria.push(alert.make + (alert.model ? ` ${alert.model}` : ""));
  }
  if (alert.year_min || alert.year_max) {
    if (alert.year_min && alert.year_max) {
      criteria.push(`${alert.year_min}-${alert.year_max}`);
    } else if (alert.year_min) {
      criteria.push(`${alert.year_min}+`);
    } else {
      criteria.push(`Up to ${alert.year_max}`);
    }
  }
  if (alert.price_min || alert.price_max) {
    if (alert.price_min && alert.price_max) {
      criteria.push(`€${alert.price_min.toLocaleString()}-€${alert.price_max.toLocaleString()}`);
    } else if (alert.price_min) {
      criteria.push(`€${alert.price_min.toLocaleString()}+`);
    } else {
      criteria.push(`Up to €${alert.price_max!.toLocaleString()}`);
    }
  }
  if (alert.location) {
    criteria.push(alert.location);
  }
  if (alert.transmission) {
    criteria.push(alert.transmission);
  }

  return criteria.length > 0 ? criteria : ["All listings"];
}

function buildSearchUrl(alert: SearchAlert): string {
  const params = new URLSearchParams();

  if (alert.category) params.set("category", alert.category);
  if (alert.make) params.set("make", alert.make);
  if (alert.model) params.set("model", alert.model);
  if (alert.year_min) params.set("yearMin", String(alert.year_min));
  if (alert.year_max) params.set("yearMax", String(alert.year_max));
  if (alert.price_min) params.set("priceMin", String(alert.price_min));
  if (alert.price_max) params.set("priceMax", String(alert.price_max));
  if (alert.location) params.set("location", alert.location);
  if (alert.transmission) params.set("transmission", alert.transmission);

  const queryString = params.toString();
  return queryString ? `/browse?${queryString}` : "/browse";
}

export default function AlertsList({ alerts, matchCounts }: Props) {
  // Create a lookup map for match counts
  const countMap = new Map(matchCounts.map((c) => [c.alertId, c]));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {alerts.map((alert) => {
        const counts = countMap.get(alert.id);
        return (
          <AlertItem
            key={alert.id}
            alert={alert}
            newCount={counts?.newCount ?? 0}
            totalCount={counts?.totalCount ?? 0}
          />
        );
      })}
    </div>
  );
}

function AlertItem({
  alert: searchAlert,
  newCount,
  totalCount,
}: {
  alert: SearchAlert;
  newCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const criteria = formatCriteria(searchAlert);
  const searchUrl = buildSearchUrl(searchAlert);

  async function handleDelete() {
    if (!confirm("Delete this alert?")) return;
    if (loading) return;
    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        alert("Your session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/alerts/${searchAlert.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? "Failed to delete alert.");
        setLoading(false);
      }
    } catch {
      window.alert("Something went wrong.");
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        window.alert("Your session expired. Please sign in again.");
        setToggling(false);
        return;
      }

      const res = await fetch(`/api/alerts/${searchAlert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !searchAlert.is_active }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? "Failed to update alert.");
      }
    } catch {
      window.alert("Something went wrong.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div
      style={{
        ...styles.alertCard,
        opacity: searchAlert.is_active ? 1 : 0.6,
        borderLeft: newCount > 0 ? "4px solid var(--green-900)" : undefined,
      }}
    >
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.name}>{searchAlert.name}</span>
          {newCount > 0 && (
            <span style={styles.newBadge}>{newCount} new</span>
          )}
          {!searchAlert.is_active && (
            <span style={styles.pausedBadge}>Paused</span>
          )}
        </div>
        <div style={styles.criteria}>
          {criteria.map((c, i) => (
            <span key={i} className="pill" style={{ fontSize: 12 }}>
              {c}
            </span>
          ))}
        </div>
        <div style={styles.meta}>
          {totalCount > 0 && (
            <span style={{ color: "var(--green-900)", fontWeight: 700 }}>
              {totalCount} match{totalCount !== 1 ? "es" : ""} •{" "}
            </span>
          )}
          Created {new Date(searchAlert.created_at).toLocaleDateString("en-IE")}
          {searchAlert.email_notifications && " • Email notifications on"}
        </div>
      </div>
      <div style={styles.actions}>
        <Link className="btn btn-primary" href={searchUrl}>
          View
        </Link>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleToggle}
          disabled={toggling}
        >
          {toggling ? "..." : searchAlert.is_active ? "Pause" : "Resume"}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleDelete}
          disabled={loading}
          style={{ color: "rgba(220,38,38,1)" }}
        >
          {loading ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  alertCard: {
    padding: 12,
    borderRadius: 12,
    background: "var(--soft)",
    border: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  content: {
    display: "grid",
    gap: 6,
    flex: 1,
    minWidth: 200,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontWeight: 900,
    color: "var(--green-900)",
  },
  pausedBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted)",
    background: "var(--border)",
    padding: "2px 8px",
    borderRadius: 999,
  },
  newBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "white",
    background: "var(--green-900)",
    padding: "2px 8px",
    borderRadius: 999,
  },
  criteria: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  meta: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 650,
  },
  actions: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },
};
