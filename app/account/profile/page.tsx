import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import EditProfileForm from "@/app/components/EditProfileForm";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  social_link: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, user_id, display_name, bio, location, social_link, phone, avatar_url, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="container" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" }}>
            Edit Profile
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontWeight: 650 }}>
            Customize how you appear to other users
          </p>
        </div>
        <Link className="btn btn-secondary" href="/account">
          Back to Account
        </Link>
      </div>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "var(--soft)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>
            Email
          </div>
          <div style={{ fontWeight: 800, color: "var(--green-900)" }}>
            {user.email}
          </div>
        </div>

        <EditProfileForm
          initialDisplayName={profile?.display_name ?? ""}
          initialBio={profile?.bio ?? ""}
          initialLocation={profile?.location ?? ""}
          initialSocialLink={profile?.social_link ?? ""}
          initialPhone={profile?.phone ?? ""}
        />
      </section>

      {profile && (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
            Profile Info
          </div>
          <div style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--muted)", fontWeight: 650 }}>
            <div>Member since: {new Date(profile.created_at).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div>Last updated: {new Date(profile.updated_at).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </section>
      )}
    </main>
  );
}
