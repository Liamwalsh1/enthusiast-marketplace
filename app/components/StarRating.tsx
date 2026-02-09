"use client";

import { useState, type CSSProperties } from "react";

type Props = {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export default function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange,
}: Props) {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = [];
  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= displayRating;
    const halfFilled = !filled && i - 0.5 <= displayRating;

    stars.push(
      <span
        key={i}
        onClick={interactive && onChange ? () => onChange(i) : undefined}
        onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
        onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        style={{
          ...starStyles,
          cursor: interactive ? "pointer" : "default",
          fontSize: size,
          transform: interactive && hoverRating === i ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.1s ease",
        }}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={
          interactive && onChange
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(i);
                }
              }
            : undefined
        }
      >
        {filled ? (
          <FilledStar size={size} />
        ) : halfFilled ? (
          <HalfStar size={size} />
        ) : (
          <EmptyStar size={size} />
        )}
      </span>
    );
  }

  return (
    <div
      style={{ display: "flex", gap: 2 }}
      onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
    >
      {stars}
    </div>
  );
}

function FilledStar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function HalfStar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      <path
        fill="url(#half)"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}

function EmptyStar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#d1d5db">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const starStyles: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export function RatingDisplay({
  rating,
  reviewCount,
  size = 16,
}: {
  rating: number | null;
  reviewCount: number;
  size?: number;
}) {
  if (!rating || reviewCount === 0) {
    return (
      <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 650 }}>
        No reviews yet
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <StarRating rating={rating} size={size} />
      <span style={{ color: "var(--green-900)", fontWeight: 800, fontSize: 14 }}>
        {rating.toFixed(1)}
      </span>
      <span style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13 }}>
        ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
      </span>
    </div>
  );
}
