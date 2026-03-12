"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Props = {
  threadId: string;
};

export default function MessageComposer({ threadId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const successTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    };
  }, []);

  function handleImageSelect(file: File | null) {
    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB");
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadImage(): Promise<string | null> {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("threadId", threadId);

      const res = await fetch("/api/messages/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      return data.image_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      setError(message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSessionExpired(false);

    const trimmed = body.trim();
    if (!trimmed && !selectedImage) {
      setError("Message or image is required.");
      return;
    }

    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        setLoading(false);
        setError("Your session expired. Please sign in again.");
        setSessionExpired(true);
        return;
      }

      // Upload image first if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (selectedImage && !imageUrl) {
          // Upload failed, error already set
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          body: trimmed || undefined,
          image_url: imageUrl || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Failed to send message.");
        setLoading(false);
        if (res.status === 401 || res.status === 403) {
          setSessionExpired(true);
        }
        return;
      }

      setBody("");
      removeImage();
      setLoading(false);
      setSuccess("Message sent");
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
      successTimer.current = setTimeout(() => {
        setSuccess(null);
      }, 2000);
      router.refresh();
    } catch (err) {
      setLoading(false);
      const detail =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: string }).message === "string"
          ? (err as { message?: string }).message ?? "Unexpected error."
          : "Unexpected error.";
      setError(detail);
    }
  }

  const isDisabled = loading || uploadingImage || (body.trim().length === 0 && !selectedImage);

  return (
    <form onSubmit={sendMessage} style={{ marginTop: 16, display: "grid", gap: 8 }}>
      {imagePreview && (
        <div style={{ position: "relative", display: "inline-block", width: "fit-content" }}>
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: 200,
              maxHeight: 150,
              borderRadius: 10,
              border: "2px solid var(--border)",
            }}
          />
          <button
            type="button"
            onClick={removeImage}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "none",
              background: "rgba(220, 38, 38, 0.9)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>
      )}

      <textarea
        className="textarea"
        rows={3}
        maxLength={2000}
        placeholder="Write a message…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />

      {error ? (
        <div
          className="card"
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(220,38,38,.3)",
            background: "rgba(220,38,38,.08)",
            color: "rgba(153,27,27,1)",
            fontWeight: 700,
          }}
        >
          <div>{error}</div>
          {sessionExpired ? (
            <Link className="btn btn-secondary" href={`/login?next=${encodeURIComponent(`/messages/${threadId}`)}`} style={{ marginTop: 8 }}>
              Sign in again
            </Link>
          ) : null}
        </div>
      ) : null}

      {success ? (
        <div
          className="card"
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(34,197,94,.3)",
            background: "rgba(34,197,94,0.1)",
            color: "var(--green-900)",
            fontWeight: 700,
          }}
        >
          {success}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || uploadingImage}
          style={{ padding: "10px 14px" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <button className="btn btn-primary" type="submit" disabled={isDisabled} style={{ flex: 1 }}>
          {uploadingImage ? "Uploading…" : loading ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
