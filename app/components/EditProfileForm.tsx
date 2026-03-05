"use client";

import { FormEvent, useState, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/useToast";
import { IRISH_COUNTIES } from "@/app/lib/constants";

type Props = {
  initialDisplayName: string;
  initialBio: string;
  initialLocation: string;
  initialSocialLink: string;
  initialPhone: string;
  initialAvatarUrl: string | null;
};

export default function EditProfileForm({
  initialDisplayName,
  initialBio,
  initialLocation,
  initialSocialLink,
  initialPhone,
  initialAvatarUrl,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [socialLink, setSocialLink] = useState(initialSocialLink);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      setAvatarUrl(data.avatar_url);
      toast({ type: "success", message: "Profile picture updated" });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar";
      toast({ type: "error", message });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarDelete() {
    if (!avatarUrl) return;
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove avatar");
      }

      setAvatarUrl(null);
      toast({ type: "success", message: "Profile picture removed" });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove avatar";
      toast({ type: "error", message });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          bio: bio.trim(),
          location: location,
          social_link: socialLink.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast({ type: "success", message: "Profile updated" });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      toast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      {/* Avatar Section */}
      <div style={avatarSectionStyle}>
        <div style={avatarContainerStyle}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" style={avatarImageStyle} />
          ) : (
            <div style={avatarPlaceholderStyle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div style={avatarActionsStyle}>
          <label style={labelStyle}>Profile Picture</label>
          <div style={hintStyle}>Max 5MB, JPEG/PNG/WebP/GIF</div>
          <div style={avatarButtonsStyle}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
                e.target.value = "";
              }}
              disabled={uploadingAvatar}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              style={{ fontSize: 13, padding: "8px 14px" }}
            >
              {uploadingAvatar ? "Uploading..." : avatarUrl ? "Change" : "Upload"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={uploadingAvatar}
                style={removeAvatarBtnStyle}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      <div>
        <label style={labelStyle}>Display Name</label>
        <input
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to be known"
          maxLength={100}
          disabled={loading}
        />
        <div style={hintStyle}>This will be shown instead of your email on comments and listings</div>
      </div>

      <div>
        <label style={labelStyle}>Bio</label>
        <textarea
          className="textarea"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell other enthusiasts about yourself..."
          maxLength={500}
          disabled={loading}
        />
        <div style={hintStyle}>{bio.length}/500 characters</div>
      </div>

      <div>
        <label style={labelStyle}>Location</label>
        <select
          className="select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading}
        >
          <option value="">Select county...</option>
          {IRISH_COUNTIES.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Social Link</label>
        <input
          className="input"
          type="url"
          value={socialLink}
          onChange={(e) => setSocialLink(e.target.value)}
          placeholder="https://facebook.com/yourprofile or https://instagram.com/yourprofile"
          maxLength={200}
          disabled={loading}
        />
        <div style={hintStyle}>Link to your Facebook, Instagram, or other social profile</div>
      </div>

      <div>
        <label style={labelStyle}>Phone</label>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Your contact number"
          maxLength={20}
          disabled={loading}
        />
        <div style={hintStyle}>Only shown to users you message with</div>
      </div>

      {error && (
        <div className="card" style={errorStyles}>
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontWeight: 800,
  color: "var(--green-900)",
  marginBottom: 4,
};

const hintStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  fontWeight: 650,
  marginTop: 4,
};

const errorStyles: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.3)",
  background: "rgba(220,38,38,.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
};

const avatarSectionStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
};

const avatarContainerStyle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: 20,
  overflow: "hidden",
  flexShrink: 0,
  background: "var(--soft)",
  border: "2px solid var(--border)",
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarPlaceholderStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--muted)",
};

const avatarActionsStyle: CSSProperties = {
  flex: 1,
};

const avatarButtonsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const removeAvatarBtnStyle: CSSProperties = {
  fontSize: 13,
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid rgba(220, 38, 38, 0.3)",
  background: "rgba(220, 38, 38, 0.08)",
  color: "rgb(185, 28, 28)",
  fontWeight: 650,
  cursor: "pointer",
};

const dividerStyle: CSSProperties = {
  height: 1,
  background: "var(--border)",
  margin: "8px 0",
};
