"use client";

import { useMemo, useRef, useState } from "react";

export default function ImageCarousel({
  title,
  urls,
  height = 280,
}: {
  title: string;
  urls: string[];
  height?: number;
}) {
  const safeUrls = useMemo(() => (Array.isArray(urls) ? urls.filter(Boolean) : []), [urls]);
  const [index, setIndex] = useState(0);

  const displayIndex = safeUrls.length ? Math.min(index, safeUrls.length - 1) : 0;

  const startX = useRef<number | null>(null);
  const deltaX = useRef<number>(0);

  const canGo = safeUrls.length > 1;

  function prev() {
    if (!canGo) return;
    setIndex((i) => (i - 1 + safeUrls.length) % safeUrls.length);
  }

  function next() {
    if (!canGo) return;
    setIndex((i) => (i + 1) % safeUrls.length);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!canGo) return;
    startX.current = e.clientX;
    deltaX.current = 0;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    deltaX.current = e.clientX - startX.current;
  }

  function onPointerUp() {
    if (!canGo || startX.current === null) {
      startX.current = null;
      deltaX.current = 0;
      return;
    }

    const dx = deltaX.current;
    const threshold = 40; // swipe sensitivity

    if (dx > threshold) prev();
    else if (dx < -threshold) next();

    startX.current = null;
    deltaX.current = 0;
  }

  if (!safeUrls.length) {
    return (
      <div
        style={{
          height,
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--soft)",
          display: "grid",
          placeItems: "center",
          color: "var(--muted)",
          fontWeight: 750,
        }}
      >
        No photos yet
      </div>
    );
  }

  return (
    <div>
      <div
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        }}
        style={{
          position: "relative",
          height,
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--soft)",
          touchAction: "pan-y",
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
            src={safeUrls[displayIndex]}
            alt={`${title} photo ${displayIndex + 1}`}
            loading="eager"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
        />


        {canGo ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              style={navBtnStyle("left")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              style={navBtnStyle("right")}
            >
              ›
            </button>

            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 10,
                display: "flex",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {safeUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to photo ${i + 1}`}
                  onClick={() => setIndex(i)}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.65)",
                    background: i === displayIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {canGo ? (
        <div style={{ marginTop: 8, color: "var(--muted)", fontWeight: 650, fontSize: 13 }}>
          {displayIndex + 1} / {safeUrls.length} (swipe or use arrows)
        </div>
      ) : null}
    </div>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 10,

    width: 40,
    height: 40,
    borderRadius: 999,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    border: "1px solid rgba(255,255,255,0.55)",
    background: "rgba(0,0,0,0.35)",
    color: "white",

    fontSize: 28,
    fontWeight: 700,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  } as React.CSSProperties;
}
