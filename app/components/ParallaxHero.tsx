"use client";

import { useEffect, useRef } from "react";

export default function ParallaxHero({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      if (ref.current) {
        ref.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div ref={ref} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
