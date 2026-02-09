"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  IRISH_COUNTIES,
  CAR_MAKES,
  CAR_MODELS_BY_MAKE,
  WHEEL_DIAMETERS,
  WHEEL_BRANDS,
  BOLT_PATTERNS,
} from "../lib/constants";
import ListingCard from "../components/ListingCard";

type Category = "car" | "part" | "memorabilia" | "wheels" | "";

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia" | "wheels";
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  created_at: string;
  status?: string | null;
  image_urls?: string[] | null;
  blur_data_urls?: string[] | null;
  // Car-specific fields
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  transmission?: string | null;
  // Wheel-specific fields
  wheel_diameter?: number | null;
  wheel_width?: number | null;
  bolt_pattern?: string | null;
  wheel_brand?: string | null;
  wheel_quantity?: number | null;
};

type Filters = {
  search: string;
  category: Category;
  make: string;
  model: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  location: string;
  transmission: string;
  hideSold: boolean;
  // Wheel-specific filters
  wheelDiameter: string;
  wheelBrand: string;
  boltPattern: string;
};

const defaultFilters: Filters = {
  search: "",
  category: "",
  make: "",
  model: "",
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  location: "",
  transmission: "",
  hideSold: true,
  wheelDiameter: "",
  wheelBrand: "",
  boltPattern: "",
};

const ITEMS_PER_PAGE = 12;

const DEBOUNCE_MS = 400;

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);

  // Separate state for search input (immediate UI update) vs debounced filter
  const [searchInput, setSearchInput] = useState("");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize search from URL params on mount
  useEffect(() => {
    if (initializedFromUrl) return;

    const urlSearch = searchParams.get("search");
    const urlCategory = searchParams.get("category");

    if (urlSearch || urlCategory) {
      setFilters((prev) => ({
        ...prev,
        search: urlSearch || "",
        category: (urlCategory as Category) || "",
      }));
      if (urlSearch) {
        setSearchInput(urlSearch);
      }
    }
    setInitializedFromUrl(true);
  }, [searchParams, initializedFromUrl]);

  // Save search to recent history
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    try {
      const key = "marketplace_recent_searches";
      const recent = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      const updated = [query.trim(), ...recent.filter((s) => s.toLowerCase() !== query.trim().toLowerCase())].slice(0, 5);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);

    // Clear existing timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new timeout to update the actual filter
    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPage(1);
      // Save to recent searches when user stops typing
      if (value.trim()) {
        saveRecentSearch(value);
      }
    }, DEBOUNCE_MS);
  }, [saveRecentSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Reset model when make changes
      if (key === "make") {
        next.model = "";
      }
      return next;
    });
    setPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchInput(""); // Also clear the search input
    setPage(1);
  }, []);

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "hideSold") return value === true;
    return value !== "";
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      // Build base query for both count and data
      let baseQuery = supabase
        .from("listings")
        .select("id,title,category,price_eur,location,condition,created_at,status,image_urls,blur_data_urls,make,model,year,mileage_km,transmission,wheel_diameter,wheel_width,bolt_pattern,wheel_brand,wheel_quantity", { count: "exact" })
        .in("status", ["active", "sold"]) // Only show approved listings
        .order("created_at", { ascending: false });

      // Apply filters - search across multiple fields
      if (filters.search.trim()) {
        const pattern = `%${filters.search.trim()}%`;
        baseQuery = baseQuery.or(
          `title.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern},wheel_brand.ilike.${pattern}`
        );
      }
      if (filters.category) {
        baseQuery = baseQuery.eq("category", filters.category);
      }
      if (filters.make) {
        baseQuery = baseQuery.eq("make", filters.make);
      }
      if (filters.model) {
        baseQuery = baseQuery.eq("model", filters.model);
      }
      if (filters.yearMin) {
        const yearMin = parseInt(filters.yearMin, 10);
        if (Number.isFinite(yearMin)) {
          baseQuery = baseQuery.gte("year", yearMin);
        }
      }
      if (filters.yearMax) {
        const yearMax = parseInt(filters.yearMax, 10);
        if (Number.isFinite(yearMax)) {
          baseQuery = baseQuery.lte("year", yearMax);
        }
      }
      if (filters.priceMin) {
        const priceMin = parseInt(filters.priceMin, 10);
        if (Number.isFinite(priceMin)) {
          baseQuery = baseQuery.gte("price_eur", priceMin);
        }
      }
      if (filters.priceMax) {
        const priceMax = parseInt(filters.priceMax, 10);
        if (Number.isFinite(priceMax)) {
          baseQuery = baseQuery.lte("price_eur", priceMax);
        }
      }
      if (filters.location) {
        baseQuery = baseQuery.eq("location", filters.location);
      }
      if (filters.transmission) {
        baseQuery = baseQuery.eq("transmission", filters.transmission);
      }
      if (filters.hideSold) {
        baseQuery = baseQuery.neq("status", "sold");
      }
      // Wheel-specific filters
      if (filters.wheelDiameter) {
        const diameter = parseFloat(filters.wheelDiameter);
        if (Number.isFinite(diameter)) {
          baseQuery = baseQuery.eq("wheel_diameter", diameter);
        }
      }
      if (filters.wheelBrand) {
        baseQuery = baseQuery.eq("wheel_brand", filters.wheelBrand);
      }
      if (filters.boltPattern) {
        baseQuery = baseQuery.eq("bolt_pattern", filters.boltPattern);
      }

      // Add pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      baseQuery = baseQuery.range(from, to);

      const { data, error, count } = await baseQuery;

      if (!isMounted) return;

      if (error) setErrorMsg(error.message);
      setListings((data ?? []) as Listing[]);
      setTotalCount(count ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [filters, page]);

  return (
    <main className="container">
      <div className="page-top-row">
        <div>
          <h1 className="page-title">Browse</h1>
          <p style={styles.p}>
            {loading ? "Loading..." : `${totalCount} listing${totalCount !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Post an ad
        </Link>
      </div>

      {/* Search and Filters */}
      <section className="card" style={{ padding: 16, marginTop: 14 }}>
        {/* Search bar */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            type="text"
            placeholder="Search listings..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {showFilters ? "Hide filters" : "Show filters"}
            {hasActiveFilters && <span style={styles.filterBadge}>{Object.values(filters).filter((v) => v !== "" && v !== false).length}</span>}
          </button>
          {hasActiveFilters && (
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {/* Row 1: Category, Location */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Category</label>
                <select
                  className="select"
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value as Category)}
                >
                  <option value="">All categories</option>
                  <option value="car">Car</option>
                  <option value="wheels">Wheels</option>
                  <option value="part">Part</option>
                  <option value="memorabilia">Memorabilia</option>
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Location</label>
                <select
                  className="select"
                  value={filters.location}
                  onChange={(e) => updateFilter("location", e.target.value)}
                >
                  <option value="">All locations</option>
                  {IRISH_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Make, Model (only for cars or all) */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Make</label>
                <select
                  className="select"
                  value={filters.make}
                  onChange={(e) => updateFilter("make", e.target.value)}
                >
                  <option value="">All makes</option>
                  {CAR_MAKES.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Model</label>
                <select
                  className="select"
                  value={filters.model}
                  onChange={(e) => updateFilter("model", e.target.value)}
                  disabled={!filters.make}
                >
                  <option value="">{filters.make ? "All models" : "Select make first"}</option>
                  {filters.make && CAR_MODELS_BY_MAKE[filters.make]?.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Year range */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Year (min)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 1990"
                  value={filters.yearMin}
                  onChange={(e) => updateFilter("yearMin", e.target.value)}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Year (max)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 2024"
                  value={filters.yearMax}
                  onChange={(e) => updateFilter("yearMax", e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Price range */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Price min (EUR)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 5000"
                  value={filters.priceMin}
                  onChange={(e) => updateFilter("priceMin", e.target.value)}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Price max (EUR)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 50000"
                  value={filters.priceMax}
                  onChange={(e) => updateFilter("priceMax", e.target.value)}
                />
              </div>
            </div>

            {/* Row 5: Transmission (car-specific) */}
            {(filters.category === "" || filters.category === "car") && (
              <div className="filter-row">
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Transmission</label>
                  <select
                    className="select"
                    value={filters.transmission}
                    onChange={(e) => updateFilter("transmission", e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Semi-Automatic">Semi-Automatic</option>
                    <option value="CVT">CVT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div />
              </div>
            )}

            {/* Wheel-specific filters */}
            {(filters.category === "" || filters.category === "wheels") && (
              <>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Wheel Brand</label>
                    <select
                      className="select"
                      value={filters.wheelBrand}
                      onChange={(e) => updateFilter("wheelBrand", e.target.value)}
                    >
                      <option value="">All brands</option>
                      {WHEEL_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Diameter</label>
                    <select
                      className="select"
                      value={filters.wheelDiameter}
                      onChange={(e) => updateFilter("wheelDiameter", e.target.value)}
                    >
                      <option value="">All sizes</option>
                      {WHEEL_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          {d}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Bolt Pattern</label>
                    <select
                      className="select"
                      value={filters.boltPattern}
                      onChange={(e) => updateFilter("boltPattern", e.target.value)}
                    >
                      <option value="">All patterns</option>
                      {BOLT_PATTERNS.map((bp) => (
                        <option key={bp} value={bp}>
                          {bp}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div />
                </div>
              </>
            )}

            {/* Hide sold checkbox */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Status</label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters.hideSold}
                    onChange={(e) => updateFilter("hideSold", e.target.checked)}
                  />
                  <span>Hide sold listings</span>
                </label>
              </div>
              <div />
            </div>
          </div>
        )}
      </section>

      {loading ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>Loading listings…</div>
          <div style={styles.muted}>One moment.</div>
        </section>
      ) : errorMsg ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>Couldn’t load listings</div>
          <div style={styles.muted}>{errorMsg}</div>
        </section>
      ) : listings.length === 0 ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>No listings found</div>
          <div style={styles.muted}>Try adjusting your filters or create one on the Sell page.</div>
        </section>
      ) : (
        <>
          <section style={{ marginTop: 14 }} className="grid-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} isLoggedIn={isLoggedIn} showCategory />
            ))}
          </section>

          {/* Pagination */}
          {totalCount > ITEMS_PER_PAGE && (
            <div style={styles.pagination}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={styles.pageBtn}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
                disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                style={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 },
  cardPad: { padding: 16, marginTop: 12 },
  title: { fontWeight: 950, color: "var(--green-900)" },
  muted: { color: "var(--muted)", fontWeight: 650, marginTop: 6 },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const },
  filterBadge: {
    background: "var(--green-600)",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 0",
    fontWeight: 650,
    color: "var(--green-900)",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 24,
    paddingBottom: 8,
  },
  pageBtn: {
    minWidth: 100,
  },
  pageInfo: {
    fontWeight: 700,
    color: "var(--green-900)",
    fontSize: 14,
  },
};

// Wrap in Suspense for useSearchParams
export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <section className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 950, color: "var(--green-900)" }}>Loading...</div>
          </section>
        </main>
      }
    >
      <BrowsePageContent />
    </Suspense>
  );
}
