"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import {
  IRISH_COUNTIES,
  CAR_MAKES,
  CAR_MODELS_BY_MAKE,
  WHEEL_DIAMETERS,
  WHEEL_BRANDS,
  BOLT_PATTERNS,
} from "@/app/lib/constants";
import ListingCard from "./ListingCard";

type CategoryType = "car" | "wheels";

type Listing = {
  id: string;
  title: string;
  category: CategoryType;
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  created_at: string;
  status?: string | null;
  image_urls?: string[] | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  transmission?: string | null;
  wheel_diameter?: number | null;
  wheel_width?: number | null;
  bolt_pattern?: string | null;
  wheel_brand?: string | null;
  wheel_quantity?: number | null;
};

type Props = {
  category: CategoryType;
  title: string;
  description: string;
};

const ITEMS_PER_PAGE = 12;
const DEBOUNCE_MS = 400;

export default function CategoryListings({ category, title, description }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [hideSold, setHideSold] = useState(true);

  // Car-specific filters
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [transmission, setTransmission] = useState("");

  // Wheel-specific filters
  const [wheelDiameter, setWheelDiameter] = useState("");
  const [wheelBrand, setWheelBrand] = useState("");
  const [boltPattern, setBoltPattern] = useState("");

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

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

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    setHideSold(true);
    setMake("");
    setModel("");
    setYearMin("");
    setYearMax("");
    setTransmission("");
    setWheelDiameter("");
    setWheelBrand("");
    setBoltPattern("");
    setPage(1);
  }, []);

  const hasActiveFilters =
    search ||
    location ||
    priceMin ||
    priceMax ||
    !hideSold ||
    make ||
    model ||
    yearMin ||
    yearMax ||
    transmission ||
    wheelDiameter ||
    wheelBrand ||
    boltPattern;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      let query = supabase
        .from("listings")
        .select(
          "id,title,category,price_eur,location,condition,created_at,status,image_urls,make,model,year,mileage_km,transmission,wheel_diameter,wheel_width,bolt_pattern,wheel_brand,wheel_quantity",
          { count: "exact" }
        )
        .eq("category", category)
        .in("status", ["active", "sold"])
        .order("created_at", { ascending: false });

      if (search.trim()) {
        const pattern = `%${search.trim()}%`;
        // Search across multiple fields based on category
        if (category === "car") {
          query = query.or(`title.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern}`);
        } else if (category === "wheels") {
          query = query.or(`title.ilike.${pattern},wheel_brand.ilike.${pattern}`);
        } else {
          query = query.ilike("title", pattern);
        }
      }
      if (location) {
        query = query.eq("location", location);
      }
      if (priceMin) {
        const min = parseInt(priceMin, 10);
        if (Number.isFinite(min)) query = query.gte("price_eur", min);
      }
      if (priceMax) {
        const max = parseInt(priceMax, 10);
        if (Number.isFinite(max)) query = query.lte("price_eur", max);
      }
      if (hideSold) {
        query = query.neq("status", "sold");
      }

      // Car-specific filters
      if (category === "car") {
        if (make) query = query.eq("make", make);
        if (model) query = query.eq("model", model);
        if (yearMin) {
          const min = parseInt(yearMin, 10);
          if (Number.isFinite(min)) query = query.gte("year", min);
        }
        if (yearMax) {
          const max = parseInt(yearMax, 10);
          if (Number.isFinite(max)) query = query.lte("year", max);
        }
        if (transmission) query = query.eq("transmission", transmission);
      }

      // Wheel-specific filters
      if (category === "wheels") {
        if (wheelDiameter) {
          const d = parseFloat(wheelDiameter);
          if (Number.isFinite(d)) query = query.eq("wheel_diameter", d);
        }
        if (wheelBrand) query = query.eq("wheel_brand", wheelBrand);
        if (boltPattern) query = query.eq("bolt_pattern", boltPattern);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

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
  }, [
    category,
    search,
    location,
    priceMin,
    priceMax,
    hideSold,
    make,
    model,
    yearMin,
    yearMax,
    transmission,
    wheelDiameter,
    wheelBrand,
    boltPattern,
    page,
  ]);

  return (
    <main className="container">
      <div className="page-top-row">
        <div>
          <h1 className="page-title">{title}</h1>
          <p style={styles.p}>
            {loading ? "Loading..." : `${totalCount} listing${totalCount !== 1 ? "s" : ""}`}
            {" · "}{description}
          </p>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Sell {category === "car" ? "a car" : category === "wheels" ? "wheels" : category === "part" ? "a part" : "memorabilia"}
        </Link>
      </div>

      {/* Search and Filters */}
      <section className="card" style={{ padding: 16, marginTop: 14 }}>
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
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          {hasActiveFilters && (
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {/* Common filters: Location */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Location</label>
                <select
                  className="select"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                >
                  <option value="">All locations</option>
                  {IRISH_COUNTIES.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Status</label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={hideSold}
                    onChange={(e) => { setHideSold(e.target.checked); setPage(1); }}
                  />
                  <span>Hide sold listings</span>
                </label>
              </div>
            </div>

            {/* Price range */}
            <div className="filter-row">
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Price min (EUR)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 500"
                  value={priceMin}
                  onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Price max (EUR)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 50000"
                  value={priceMax}
                  onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {/* Car-specific filters */}
            {category === "car" && (
              <>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Make</label>
                    <select
                      className="select"
                      value={make}
                      onChange={(e) => { setMake(e.target.value); setModel(""); setPage(1); }}
                    >
                      <option value="">All makes</option>
                      {CAR_MAKES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Model</label>
                    <select
                      className="select"
                      value={model}
                      onChange={(e) => { setModel(e.target.value); setPage(1); }}
                      disabled={!make}
                    >
                      <option value="">{make ? "All models" : "Select make first"}</option>
                      {make && CAR_MODELS_BY_MAKE[make]?.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Year (min)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="e.g. 1990"
                      value={yearMin}
                      onChange={(e) => { setYearMin(e.target.value); setPage(1); }}
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Year (max)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="e.g. 2024"
                      value={yearMax}
                      onChange={(e) => { setYearMax(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Transmission</label>
                    <select
                      className="select"
                      value={transmission}
                      onChange={(e) => { setTransmission(e.target.value); setPage(1); }}
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
              </>
            )}

            {/* Wheel-specific filters */}
            {category === "wheels" && (
              <>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Brand</label>
                    <select
                      className="select"
                      value={wheelBrand}
                      onChange={(e) => { setWheelBrand(e.target.value); setPage(1); }}
                    >
                      <option value="">All brands</option>
                      {WHEEL_BRANDS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Diameter</label>
                    <select
                      className="select"
                      value={wheelDiameter}
                      onChange={(e) => { setWheelDiameter(e.target.value); setPage(1); }}
                    >
                      <option value="">All sizes</option>
                      {WHEEL_DIAMETERS.map((d) => (
                        <option key={d} value={d}>{d}&quot;</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="filter-row">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Bolt Pattern</label>
                    <select
                      className="select"
                      value={boltPattern}
                      onChange={(e) => { setBoltPattern(e.target.value); setPage(1); }}
                    >
                      <option value="">All patterns</option>
                      {BOLT_PATTERNS.map((bp) => (
                        <option key={bp} value={bp}>{bp}</option>
                      ))}
                    </select>
                  </div>
                  <div />
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Listings */}
      {loading ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>Loading listings…</div>
        </section>
      ) : errorMsg ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>Couldn't load listings</div>
          <div style={styles.muted}>{errorMsg}</div>
        </section>
      ) : listings.length === 0 ? (
        <section className="card" style={styles.cardPad}>
          <div style={styles.title}>No listings found</div>
          <div style={styles.muted}>Try adjusting your filters or be the first to list something.</div>
        </section>
      ) : (
        <>
          <section style={{ marginTop: 14 }} className="grid-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} isLoggedIn={isLoggedIn} />
            ))}
          </section>

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
  pageBtn: { minWidth: 100 },
  pageInfo: { fontWeight: 700, color: "var(--green-900)", fontSize: 14 },
};
