"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  id: string;
  title: string;
  category: "car" | "wheels";
  make?: string | null;
  model?: string | null;
  wheel_brand?: string | null;
  price_eur: number | null;
};

type Props = {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  variant?: "home" | "inline";
};

const RECENT_SEARCHES_KEY = "marketplace_recent_searches";
const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_MS = 300;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  const recent = getRecentSearches();
  const updated = [query.trim(), ...recent.filter((s) => s.toLowerCase() !== query.trim().toLowerCase())].slice(
    0,
    MAX_RECENT_SEARCHES
  );
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function labelCategory(cat: Suggestion["category"]) {
  if (cat === "car") return "Car";
  if (cat === "wheels") return "Wheels";
  return "Wheels";
}

export default function SearchBox({
  initialValue = "",
  placeholder = "Search (e.g. E46 M3, TE37, Recaro, 996, SR20)…",
  autoFocus = false,
  onSearch,
  variant = "home",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch suggestions when query changes
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/listings/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, DEBOUNCE_MS);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      saveRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
      setShowDropdown(false);
      setSelectedIndex(-1);

      if (onSearch) {
        onSearch(trimmed);
      } else {
        router.push(`/browse?search=${encodeURIComponent(trimmed)}`);
      }
    },
    [onSearch, router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    router.push(`/listings/${suggestion.id}`);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + (recentSearches.length > 0 && !query.trim() ? recentSearches.length : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      if (!query.trim() && selectedIndex < recentSearches.length) {
        // Selected a recent search
        const selected = recentSearches[selectedIndex];
        setQuery(selected);
        handleSearch(selected);
      } else if (suggestions[selectedIndex - (recentSearches.length > 0 && !query.trim() ? recentSearches.length : 0)]) {
        // Selected a suggestion
        const suggestionIndex = selectedIndex - (recentSearches.length > 0 && !query.trim() ? recentSearches.length : 0);
        handleSuggestionClick(suggestions[suggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showSuggestions = query.trim().length >= 2 && (suggestions.length > 0 || loading);
  const shouldShowDropdown = showDropdown && (showRecent || showSuggestions);

  return (
    <form onSubmit={handleSubmit} style={variant === "home" ? styles.form : styles.formInline}>
      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          className="input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          style={variant === "home" ? styles.input : styles.inputInline}
        />

        {shouldShowDropdown && (
          <div ref={dropdownRef} style={styles.dropdown}>
            {/* Recent Searches */}
            {showRecent && (
              <>
                <div style={styles.sectionHeader}>
                  <span>Recent searches</span>
                  <button type="button" onClick={handleClearRecent} style={styles.clearBtn}>
                    Clear
                  </button>
                </div>
                {recentSearches.map((term, index) => (
                  <div
                    key={term}
                    style={{
                      ...styles.recentItem,
                      ...(selectedIndex === index ? styles.selectedItem : {}),
                    }}
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span style={styles.clockIcon}>↺</span>
                    <span>{term}</span>
                  </div>
                ))}
              </>
            )}

            {/* Suggestions */}
            {showSuggestions && (
              <>
                {loading ? (
                  <div style={styles.loadingItem}>Searching...</div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div style={styles.sectionHeader}>
                      <span>Suggestions</span>
                    </div>
                    {suggestions.map((suggestion, index) => {
                      const adjustedIndex = showRecent ? recentSearches.length + index : index;
                      return (
                        <div
                          key={suggestion.id}
                          style={{
                            ...styles.suggestionItem,
                            ...(selectedIndex === adjustedIndex ? styles.selectedItem : {}),
                          }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                        >
                          <div style={styles.suggestionContent}>
                            <div style={styles.suggestionTitle}>{suggestion.title}</div>
                            <div style={styles.suggestionMeta}>
                              <span className="pill" style={styles.categoryPill}>
                                {labelCategory(suggestion.category)}
                              </span>
                              {suggestion.category === "car" && suggestion.make && (
                                <span style={styles.metaText}>
                                  {suggestion.make}
                                  {suggestion.model ? ` ${suggestion.model}` : ""}
                                </span>
                              )}
                              {suggestion.category === "wheels" && suggestion.wheel_brand && (
                                <span style={styles.metaText}>{suggestion.wheel_brand}</span>
                              )}
                            </div>
                          </div>
                          <div style={styles.suggestionPrice}>{formatPrice(suggestion.price_eur)}</div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div style={styles.noResults}>No results found</div>
                )}
              </>
            )}

            {/* Search all hint */}
            {query.trim() && (
              <div
                style={{
                  ...styles.searchAllItem,
                  ...(selectedIndex === -1 ? {} : {}),
                }}
                onClick={() => handleSearch(query)}
              >
                <span style={styles.searchIcon}>⌕</span>
                <span>
                  Search all listings for &ldquo;<strong>{query}</strong>&rdquo;
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="btn btn-primary" type="submit" style={variant === "home" ? undefined : styles.searchBtnInline}>
        Search
      </button>
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  formInline: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flex: 1,
    minWidth: 200,
  },
  inputWrapper: {
    position: "relative",
    flex: 1,
    minWidth: 200,
  },
  input: {
    width: "100%",
  },
  inputInline: {
    width: "100%",
  },
  searchBtnInline: {
    flexShrink: 0,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid var(--border)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 100,
    maxHeight: 400,
    overflowY: "auto",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px 6px",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "var(--green-600)",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    padding: 0,
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    cursor: "pointer",
    color: "var(--green-900)",
    fontWeight: 600,
    transition: "background 0.1s",
  },
  clockIcon: {
    fontSize: 14,
    color: "var(--muted)",
  },
  loadingItem: {
    padding: "14px",
    textAlign: "center",
    color: "var(--muted)",
    fontWeight: 600,
  },
  noResults: {
    padding: "14px",
    textAlign: "center",
    color: "var(--muted)",
    fontWeight: 600,
  },
  suggestionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    gap: 12,
    transition: "background 0.1s",
  },
  selectedItem: {
    background: "var(--soft)",
  },
  suggestionContent: {
    flex: 1,
    minWidth: 0,
  },
  suggestionTitle: {
    fontWeight: 700,
    color: "var(--green-900)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  suggestionMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  categoryPill: {
    fontSize: 10,
    padding: "2px 6px",
  },
  metaText: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 600,
  },
  suggestionPrice: {
    fontWeight: 800,
    color: "var(--green-900)",
    fontSize: 14,
    flexShrink: 0,
  },
  searchAllItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    cursor: "pointer",
    borderTop: "1px solid var(--border)",
    color: "var(--green-600)",
    fontWeight: 600,
    transition: "background 0.1s",
  },
  searchIcon: {
    fontSize: 16,
  },
};
