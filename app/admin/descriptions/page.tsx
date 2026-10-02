import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import DescriptionsClient from "./descriptions-client";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage_km: number | null;
  transmission: string | null;
  condition: string | null;
  location: string | null;
  seller_notes: string | null;
  image_urls: string[] | null;
  created_at: string;
};

export default async function AdminDescriptionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/descriptions");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "admin") redirect("/");

  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,make,model,year,mileage_km,transmission,condition,location,seller_notes,image_urls,created_at")
    .eq("description_requested", true)
    .eq("pd_written", false)
    .order("created_at", { ascending: true });

  return (
    <main className="container">
      <div style={{ margin: "16px 0 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 950, color: "var(--green-900)", margin: 0 }}>
          Write Descriptions
        </h1>
        <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6, marginBottom: 0 }}>
          {listings?.length ?? 0} listing{listings?.length !== 1 ? "s" : ""} waiting for a description
        </p>
      </div>

      {!listings?.length ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 900, color: "var(--green-900)", fontSize: 18 }}>All caught up!</div>
          <p style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            No listings are waiting for a description right now.
          </p>
        </div>
      ) : (
        <DescriptionsClient listings={listings as ListingRow[]} />
      )}
    </main>
  );
}
