"use client";

import { useEffect, useState } from "react";

export default function EarlyAccessBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = document.cookie.split(";").some((c) => c.trim().startsWith("eab_dismissed="));
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `eab_dismissed=1; expires=${expires.toUTCString()}; path=/`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
        <div
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--green-900)",
            background: "rgba(20,83,45,0.08)",
            padding: "4px 12px",
            borderRadius: 999,
            marginBottom: 12,
          }}
        >
          Early access
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 950,
            color: "var(--green-900)",
            margin: "0 0 10px",
          }}
        >
          We&apos;re still building!
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontWeight: 650,
            fontSize: 15,
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          PassionDriven is in early access — you&apos;re one of the first people here. Things are taking shape but some features are still being worked on. Thanks for your patience!
        </p>
        <button
          onClick={dismiss}
          className="btn btn-primary"
          style={{ width: "100%", fontSize: 15 }}
        >
          Got it, let me explore
        </button>
        <button
          onClick={dismiss}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontWeight: 650,
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
