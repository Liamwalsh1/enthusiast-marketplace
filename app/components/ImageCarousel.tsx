"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

export default function ImageCarousel({
  title,
  urls,
  blurDataUrls,
  height = 280,
}: {
  title: string;
  urls: string[];
  blurDataUrls?: string[];
  height?: number;
}) {
  const safeUrls = useMemo(() => (Array.isArray(urls) ? urls.filter(Boolean) : []), [urls]);
  const safeBlurs = useMemo(() => (Array.isArray(blurDataUrls) ? blurDataUrls : []), [blurDataUrls]);
  const [index, setIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
  const [lightbox, setLightbox] = useState(false);

  const handleImageLoad = useCallback((idx: number) => {
    setLoadedIndices((prev) => new Set(prev).add(idx));
  }, []);

  const displayIndex = safeUrls.length ? Math.min(index, safeUrls.length - 1) : 0;

  const startX = useRef<number | null>(null);
  const deltaX = useRef<number>(0);

  const canGo = safeUrls.length > 1;

  function prev(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!canGo) return;
    setIndex((i) => (i - 1 + safeUrls.length) % safeUrls.length);
  }

  function next(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!canGo) return;
    setIndex((i) => (i + 1) % safeUrls.length);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    deltaX.current = 0;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    deltaX.current = e.clientX - startX.current;
  }

  function onPointerUp() {
    if (startX.current === null) return;
    const dx = deltaX.current;
    const threshold = 40;
    if (canGo && dx > threshold) prev();
    else if (canGo && dx < -threshold) next();
    else if (Math.abs(dx) < 8) setLightbox(true); // tap — open lightbox
    startX.current = null;
    deltaX.current = 0;
  }

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + safeUrls.length) % safeUrls.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % safeUrls.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, safeUrls.length]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

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
    <>
      {/* Carousel */}
      <div>
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if (e.key === "Enter") setLightbox(true);
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
            cursor: "zoom-in",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { startX.current = null; deltaX.current = 0; }}
          onPointerLeave={() => { startX.current = null; deltaX.current = 0; }}
        >
          {safeBlurs[displayIndex] && !loadedIndices.has(displayIndex) && (
            <img
              src={safeBlurs[displayIndex]}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(20px)",
                transform: "scale(1.1)",
              }}
            />
          )}
          <img
            src={safeUrls[displayIndex]}
            alt={`${title} photo ${displayIndex + 1}`}
            loading="eager"
            decoding="async"
            onLoad={() => handleImageLoad(displayIndex)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: loadedIndices.has(displayIndex) ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            draggable={false}
          />

          {canGo && (
            <>
              <button type="button" onClick={(e) => prev(e)} aria-label="Previous photo" style={navBtnStyle("left")}>‹</button>
              <button type="button" onClick={(e) => next(e)} aria-label="Next photo" style={navBtnStyle("right")}>›</button>
              <div style={{ position: "absolute", left: 12, right: 12, bottom: 10, display: "flex", justifyContent: "center", gap: 6 }}>
                {safeUrls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to photo ${i + 1}`}
                    onClick={(e) => { e.stopPropagation(); setIndex(i); }}
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
          )}
        </div>

        {canGo && (
          <div style={{ marginTop: 8, color: "var(--muted)", fontWeight: 650, fontSize: 13 }}>
            {displayIndex + 1} / {safeUrls.length} · tap to expand
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(0,0,0,0.5)",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            ×
          </button>

          {/* Counter */}
          {canGo && (
            <div style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 650,
              fontSize: 14,
            }}>
              {displayIndex + 1} / {safeUrls.length}
            </div>
          )}

          {/* Image */}
          <img
            src={safeUrls[displayIndex]}
            alt={`${title} photo ${displayIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "calc(100vw - 120px)",
              maxHeight: "calc(100vh - 80px)",
              objectFit: "contain",
              borderRadius: 12,
              userSelect: "none",
            }}
            draggable={false}
          />

          {/* Nav buttons */}
          {canGo && (
            <>
              <button type="button" onClick={(e) => prev(e)} aria-label="Previous photo" style={{ ...navBtnStyle("left"), width: 48, height: 48, fontSize: 32 }}>‹</button>
              <button type="button" onClick={(e) => next(e)} aria-label="Next photo" style={{ ...navBtnStyle("right"), width: 48, height: 48, fontSize: 32 }}>›</button>
            </>
          )}
        </div>
      )}
    </>
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
