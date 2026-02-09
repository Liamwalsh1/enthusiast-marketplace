"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  open: boolean;
  commentId: string;
  onClose: () => void;
};

const FLAG_REASONS = [
  "Spam or advertising",
  "Harassment or abuse",
  "Misinformation",
  "Off-topic",
  "Other",
];

export default function FlagModal({ open, commentId, onClose }: Props) {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  function handleClose() {
    setSelectedReason("");
    setCustomReason("");
    setError(null);
    setSuccess(false);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;

    if (!reason) {
      setError("Please select or enter a reason.");
      return;
    }

    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        setError("Your session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/comments/${commentId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Failed to flag comment.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        handleClose();
        router.refresh();
      }, 1500);
    } catch {
      setError("Unexpected error.");
      setLoading(false);
    }
  }

  return (
    <div style={overlayStyles} onClick={handleClose}>
      <div className="card" style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 20 }}>
          Flag Comment
        </div>
        <div style={{ color: "var(--muted)", fontWeight: 650, marginTop: 4 }}>
          Why are you flagging this comment?
        </div>

        {success ? (
          <div style={successStyles}>
            Thanks for flagging. We&apos;ll review this comment.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              {FLAG_REASONS.map((reason) => (
                <label
                  key={reason}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span style={{ fontWeight: 600 }}>{reason}</span>
                </label>
              ))}
            </div>

            {selectedReason === "Other" && (
              <textarea
                className="textarea"
                rows={2}
                maxLength={500}
                placeholder="Please describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{ marginTop: 12 }}
              />
            )}

            {error && <div style={errorStyles}>{error}</div>}

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}
            >
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !selectedReason}
              >
                {loading ? "Submitting..." : "Submit Flag"}
              </button>
            </div>
          </form>
        )}
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
  maxWidth: 400,
  padding: 20,
  borderRadius: 16,
};

const errorStyles: CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.3)",
  background: "rgba(220,38,38,.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
};

const successStyles: CSSProperties = {
  marginTop: 16,
  padding: 16,
  borderRadius: 12,
  border: "1px solid rgba(34,197,94,.3)",
  background: "rgba(34,197,94,0.1)",
  color: "var(--green-900)",
  fontWeight: 700,
  textAlign: "center",
};
