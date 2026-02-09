"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/useToast";
import { IRISH_COUNTIES } from "@/app/lib/constants";

type Props = {
  initialDisplayName: string;
  initialBio: string;
  initialLocation: string;
  initialSocialLink: string;
  initialPhone: string;
};

export default function EditProfileForm({
  initialDisplayName,
  initialBio,
  initialLocation,
  initialSocialLink,
  initialPhone,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [socialLink, setSocialLink] = useState(initialSocialLink);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
