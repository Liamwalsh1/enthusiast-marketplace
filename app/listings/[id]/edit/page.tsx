import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import EditListingForm from "@/app/components/EditListingForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/listings/${id}/edit`)}`);
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, owner_id, title, price_eur, description, status, category, location, make, model, year, transmission, mileage_km, vin, is_modified, modifications, image_urls, video_url, wheel_diameter, wheel_width, bolt_pattern, wheel_offset, center_bore, wheel_quantity, wheel_brand, wheel_material, wheel_style")
    .eq("id", id)
    .maybeSingle();

  if (error || !listing) {
    notFound();
  }

  if (listing.owner_id !== user.id) {
    return (
      <main className="container">
        <div className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>Not allowed</div>
          <p style={{ color: "var(--muted)", fontWeight: 650 }}>You do not own this listing.</p>
          <Link className="btn btn-secondary" href="/account/listings">
            Back to My Listings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)" }}>Edit listing</h1>
      <section className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
        <div style={{ color: "var(--muted)", fontWeight: 650 }}>Title: {listing.title}</div>
        <div style={{ color: "var(--muted)", fontWeight: 650 }}>Price: {listing.price_eur ?? "—"}</div>
        <div style={{ color: "var(--muted)", fontWeight: 650 }}>Status: {listing.status ?? "active"}</div>
      </section>
      <section className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <EditListingForm
          listingId={listing.id}
          ownerId={user.id}
          category={listing.category ?? "car"}
          initialTitle={listing.title ?? ""}
          initialPrice={listing.price_eur}
          initialLocation={listing.location ?? ""}
          initialDescription={listing.description ?? ""}
          initialMake={listing.make ?? ""}
          initialModel={listing.model ?? ""}
          initialYear={listing.year}
          initialTransmission={listing.transmission ?? ""}
          initialMileageKm={listing.mileage_km}
          initialVin={listing.vin ?? ""}
          initialIsModified={listing.is_modified ?? null}
          initialModifications={listing.modifications ?? []}
          initialImageUrls={listing.image_urls ?? []}
          initialVideoUrl={listing.video_url ?? null}
          initialWheelDiameter={listing.wheel_diameter}
          initialWheelWidth={listing.wheel_width}
          initialBoltPattern={listing.bolt_pattern ?? ""}
          initialWheelOffset={listing.wheel_offset}
          initialCenterBore={listing.center_bore}
          initialWheelQuantity={listing.wheel_quantity}
          initialWheelBrand={listing.wheel_brand ?? ""}
          initialWheelMaterial={listing.wheel_material ?? ""}
          initialWheelStyle={listing.wheel_style ?? ""}
        />
      </section>
    </main>
  );
}
