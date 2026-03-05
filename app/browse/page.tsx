"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/useToast";
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
  boosted_until?: string | null;
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

type SortOption = "newest" | "oldest" | "price_low" | "price_high" | "mileage_low" | "mileage_high";

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
  // Mileage filter for cars
  mileageMin: string;
  mileageMax: string;
  // Wheel-specific filters
  wheelDiameter: string;
  wheelBrand: string;
  boltPattern: string;
  // Sort
  sort: SortOption;
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
  mileageMin: "",
  mileageMax: "",
  wheelDiameter: "",
  wheelBrand: "",
  boltPattern: "",
  sort: "newest",
};

const ITEMS_PER_PAGE = 12;

const DEBOUNCE_MS = 400;

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);

  // Save search modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);

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

  // Generate a default name for the alert based on filters
  const generateAlertName = useCallback(() => {
    const parts: string[] = [];
    if (filters.make) parts.push(filters.make);
    if (filters.model) parts.push(filters.model);
    if (filters.category) {
      const catNames: Record<string, string> = { car: "Cars", wheels: "Wheels", part: "Parts", memorabilia: "Memorabilia" };
      parts.push(catNames[filters.category] || filters.category);
    }
    if (filters.location) parts.push(`in ${filters.location}`);
    if (filters.search) parts.push(`"${filters.search}"`);
    return parts.length > 0 ? parts.join(" ") : "My Search Alert";
  }, [filters]);

  // Save the current search as an alert
  const saveSearchAsAlert = useCallback(async () => {
    if (!isLoggedIn) {
      toast({ type: "error", message: "Please sign in to save searches" });
      router.push("/login?next=/browse");
      return;
    }

    if (!alertName.trim()) {
      toast({ type: "error", message: "Please enter an alert name" });
      return;
    }

    setSavingAlert(true);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: alertName.trim(),
          category: filters.category || null,
          make: filters.make || null,
          model: filters.model || null,
          year_min: filters.yearMin ? parseInt(filters.yearMin, 10) : null,
          year_max: filters.yearMax ? parseInt(filters.yearMax, 10) : null,
          price_min: filters.priceMin ? parseInt(filters.priceMin, 10) : null,
          price_max: filters.priceMax ? parseInt(filters.priceMax, 10) : null,
          location: filters.location || null,
          transmission: filters.transmission || null,
          mileage_min: filters.mileageMin ? parseInt(filters.mileageMin, 10) : null,
          mileage_max: filters.mileageMax ? parseInt(filters.mileageMax, 10) : null,
          wheel_brand: filters.wheelBrand || null,
          wheel_diameter: filters.wheelDiameter ? parseFloat(filters.wheelDiameter) : null,
          bolt_pattern: filters.boltPattern || null,
          search_text: filters.search || null,
          email_notifications: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save search");
      }

      toast({ type: "success", message: "Search saved! You'll be notified of new matches." });
      setShowSaveModal(false);
      setAlertName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save search";
      toast({ type: "error", message });
    } finally {
      setSavingAlert(false);
    }
  }, [isLoggedIn, alertName, filters, toast, router]);

  // Open save modal with generated name
  const openSaveModal = useCallback(() => {
    setAlertName(generateAlertName());
    setShowSaveModal(true);
  }, [generateAlertName]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      // Build base query for both count and data
      let baseQuery = supabase
        .from("listings")
        .select("id,title,category,price_eur,location,condition,created_at,status,image_urls,blur_data_urls,make,model,year,mileage_km,transmission,wheel_diameter,wheel_width,bolt_pattern,wheel_brand,wheel_quantity,boosted_until", { count: "exact" })
        .in("status", ["active", "sold"]); // Only show approved listings

      // Apply sorting - boosted listings always appear first
      baseQuery = baseQuery.order("boosted_until", { ascending: false, nullsFirst: false });

      // Then apply user-selected sort
      switch (filters.sort) {
        case "oldest":
          baseQuery = baseQuery.order("created_at", { ascending: true });
          break;
        case "price_low":
          baseQuery = baseQuery.order("price_eur", { ascending: true, nullsFirst: false });
          break;
        case "price_high":
          baseQuery = baseQuery.order("price_eur", { ascending: false, nullsFirst: false });
          break;
        case "mileage_low":
          baseQuery = baseQuery.order("mileage_km", { ascending: true, nullsFirst: false });
          break;
        case "mileage_high":
          baseQuery = baseQuery.order("mileage_km", { ascending: false, nullsFirst: false });
          break;
        case "newest":
        default:
          baseQuery = baseQuery.order("created_at", { ascending: false });
          break;
      }

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
      // Mileage filters (for cars)
      if (filters.mileageMin) {
        const mileageMin = parseInt(filters.mileageMin, 10);
        if (Number.isFinite(mileageMin)) {
          baseQuery = baseQuery.gte("mileage_km", mileageMin);
        }
      }
      if (filters.mileageMax) {
        const mileageMax = parseInt(filters.mileageMax, 10);
        if (Number.isFinite(mileageMax)) {
          baseQuery = baseQuery.lte("mileage_km", mileageMax);
        }
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
        {/* Search bar and sort */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            type="text"
            placeholder="Search listings..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            className="select"
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value as SortOption)}
            style={{ minWidth: 160 }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="mileage_low">Mileage: Low to High</option>
            <option value="mileage_high">Mileage: High to Low</option>
          </select>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {showFilters ? "Hide filters" : "Filters"}
            {hasActiveFilters && <span style={styles.filterBadge}>{Object.entries(filters).filter(([k, v]) => k !== "sort" && k !== "hideSold" && v !== "" && v !== false).length}</span>}
          </button>
          {hasActiveFilters && (
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear all
            </button>
          )}
          {hasActiveFilters && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={openSaveModal}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Save search
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div style={styles.filterPills}>
            {filters.category && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("category", "")}
              >
                {filters.category === "car" ? "Cars" : filters.category === "wheels" ? "Wheels" : filters.category === "part" ? "Parts" : "Memorabilia"}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.location && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("location", "")}
              >
                {filters.location}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.make && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("make", "")}
              >
                {filters.make}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.model && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("model", "")}
              >
                {filters.model}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {(filters.yearMin || filters.yearMax) && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => { updateFilter("yearMin", ""); updateFilter("yearMax", ""); }}
              >
                Year: {filters.yearMin || "Any"} - {filters.yearMax || "Any"}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => { updateFilter("priceMin", ""); updateFilter("priceMax", ""); }}
              >
                €{filters.priceMin || "0"} - €{filters.priceMax || "Any"}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {(filters.mileageMin || filters.mileageMax) && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => { updateFilter("mileageMin", ""); updateFilter("mileageMax", ""); }}
              >
                {filters.mileageMin || "0"} - {filters.mileageMax || "Any"} km
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.transmission && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("transmission", "")}
              >
                {filters.transmission}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.wheelBrand && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("wheelBrand", "")}
              >
                {filters.wheelBrand}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.wheelDiameter && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("wheelDiameter", "")}
              >
                {filters.wheelDiameter}&quot;
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.boltPattern && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => updateFilter("boltPattern", "")}
              >
                {filters.boltPattern}
                <span style={styles.pillX}>×</span>
              </button>
            )}
            {filters.search && (
              <button
                type="button"
                style={styles.filterPill}
                onClick={() => { setSearchInput(""); updateFilter("search", ""); }}
              >
                &quot;{filters.search}&quot;
                <span style={styles.pillX}>×</span>
              </button>
            )}
          </div>
        )}

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

            {/* Row 6: Mileage range (car-specific) */}
            {(filters.category === "" || filters.category === "car") && (
              <div className="filter-row">
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Mileage min (km)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 0"
                    value={filters.mileageMin}
                    onChange={(e) => updateFilter("mileageMin", e.target.value)}
                  />
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Mileage max (km)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 100000"
                    value={filters.mileageMax}
                    onChange={(e) => updateFilter("mileageMax", e.target.value)}
                  />
                </div>
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

      {/* Save Search Modal */}
      {showSaveModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Save this search</h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                style={styles.modalClose}
              >
                ×
              </button>
            </div>
            <p style={styles.modalDesc}>
              Get notified when new listings match your search criteria.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.filterLabel}>Alert name</label>
              <input
                className="input"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="e.g. JDM Sports Cars under €20k"
                maxLength={100}
                disabled={savingAlert}
                autoFocus
              />
            </div>
            <div style={styles.modalActions}>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setShowSaveModal(false)}
                disabled={savingAlert}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={saveSearchAsAlert}
                disabled={savingAlert || !alertName.trim()}
              >
                {savingAlert ? "Saving..." : "Save & get alerts"}
              </button>
            </div>
          </div>
        </div>
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
  filterPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    background: "var(--green-100)",
    color: "var(--green-900)",
    fontSize: 13,
    fontWeight: 650,
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  pillX: {
    fontSize: 16,
    lineHeight: 1,
    opacity: 0.6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "var(--green-900)",
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    fontSize: 24,
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDesc: {
    margin: "0 0 16px",
    color: "var(--muted)",
    fontWeight: 600,
    fontSize: 14,
  },
  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
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
