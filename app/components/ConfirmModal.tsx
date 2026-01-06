"use client";

import type { CSSProperties } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div style={overlayStyles} onClick={onCancel}>
      <div className="card" style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 20 }}>{title}</div>
        {description ? <div style={{ color: "var(--muted)", fontWeight: 650 }}>{description}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={loading}>
            {loading ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyles: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.25)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};

const modalStyles: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  padding: 20,
  borderRadius: 16,
};
