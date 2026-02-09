"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  statusFilter: string;
  categoryFilter: string;
  searchQuery: string;
};

export default function AdminListingsFilter({ statusFilter, categoryFilter, searchQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/admin/listings?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("q", search);
  };

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => updateFilter("category", e.target.value)}
            style={selectStyle}
          >
            <option value="all">All</option>
            <option value="car">Cars</option>
            <option value="part">Parts</option>
            <option value="memorabilia">Memorabilia</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 200 }}>
          <label style={{ fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Search:</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontWeight: 600,
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px" }}>
            Search
          </button>
          {(searchQuery || categoryFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                router.push(`/admin/listings${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`);
              }}
              className="btn btn-secondary"
              style={{ padding: "8px 16px" }}
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--soft)",
  fontWeight: 650,
  fontSize: 13,
  cursor: "pointer",
};
