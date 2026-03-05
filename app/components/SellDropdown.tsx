"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";

const categories = [
  { key: "car", label: "Car", href: "/sell?category=car" },
  { key: "wheels", label: "Wheels", href: "/sell?category=wheels" },
  { key: "part", label: "Parts", href: "/sell?category=part" },
  { key: "memorabilia", label: "Memorabilia", href: "/sell?category=memorabilia" },
];

export default function SellDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nav-btn-secondary"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Sell
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: 6,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              style={styles.dropdownItem}
              onClick={() => setIsOpen(false)}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    minWidth: 160,
    background: "white",
    borderRadius: 12,
    border: "1px solid rgba(11, 47, 26, 0.1)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    padding: "6px 0",
    zIndex: 200,
  },
  dropdownItem: {
    display: "block",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0b2f1a",
    textDecoration: "none",
    transition: "background 0.15s ease",
  },
};
