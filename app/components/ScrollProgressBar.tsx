"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? scrolled / total : 0);
    }

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      zIndex: 9999,
      pointerEvents: "none",
    }}>
      <div style={{
        height: "100%",
        width: `${progress * 100}%`,
        background: "linear-gradient(to right, var(--green-900), var(--green-700))",
        transition: "width 0.1s linear",
        borderRadius: "0 2px 2px 0",
      }} />
    </div>
  );
}
