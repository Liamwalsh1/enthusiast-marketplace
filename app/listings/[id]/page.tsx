import Link from "next/link";
import ImageCarousel from "@/app/components/ImageCarousel";
import MessageSellerCard from "@/app/components/MessageSellerCard";

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia";
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  description: string | null;
  created_at: string;
  image_urls?: string[] | null;
  owner_id: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type ListingError =
  | {
      kind: "missing-env";
      missing: string[];
    }
  | {
      kind: "fetch";
      status: number;
      detail: string;
    };

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function labelCategory(cat: Listing["category"]) {
  if (cat === "car") return "Car";
  if (cat === "part") return "Part";
  return "Memorabilia";
}

async function getListing(
  id: string
): Promise<{
  listing: Listing | null;
  error: ListingError | null;
}> {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    console.error("Listing fetch aborted. Missing env vars:", missing);
    return { listing: null, error: { kind: "missing-env", missing } };
  }

  const supabaseUrl = SUPABASE_URL!;
  const supabaseAnonKey = SUPABASE_ANON_KEY!;

  const url = new URL("/rest/v1/listings", supabaseUrl);
  url.searchParams.set(
    "select",
    "id,title,category,price_eur,location,condition,description,created_at,image_urls,owner_id"
  );
  url.searchParams.set("id", `eq.${id}`);

  const res = await fetch(url.toString(), {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: "application/json",
      "Accept-Profile": "public",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Supabase fetch failed:", res.status, text);
    return { listing: null, error: { kind: "fetch", status: res.status, detail: text || "Unknown error" } };
  }

  const rows = (await res.json()) as Listing[];
  return { listing: rows[0] ?? null, error: null };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { listing, error: listingError } = await getListing(id);
  const isMissingEnv = listingError?.kind === "missing-env";
  const isFetchError = listingError?.kind === "fetch";
  const missingEnvList = listingError?.kind === "missing-env" ? listingError.missing : [];
  const fetchDetail = listingError?.kind === "fetch" ? listingError.detail : null;
  const devDetail = process.env.NODE_ENV !== "production" ? fetchDetail : null;

  return (
    <main className="container">
      <Link className="pill" href="/browse">
        ← Back to Browse
      </Link>

      {!listing ? (
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
            {isMissingEnv ? "Configuration issue" : isFetchError ? "Unable to load listing" : "Listing not found"}
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>
            {isMissingEnv
              ? `Missing Supabase env vars: ${missingEnvList.join(", ")}`
              : isFetchError
              ? "Supabase returned an error while fetching this listing."
              : "This listing may have been removed."}
          </div>
          {devDetail ? (
            <pre
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                background: "var(--soft)",
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
                fontSize: 13,
              }}
            >
              {devDetail}
            </pre>
          ) : null}
        </section>
      ) : (
        <div className="grid-2" style={{ marginTop: 12 }}>
          <section className="card" style={{ padding: 16 }}>
            {listing.image_urls?.length ? (
              <ImageCarousel title={listing.title} urls={listing.image_urls ?? []} />

            ) : (
              <div
                style={{
                  height: 280,
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  background: "var(--soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--muted)",
                  fontWeight: 750,
                }}
              >
                No photos yet
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span className="pill">{labelCategory(listing.category)}</span>
              <span className="pill">{listing.location ?? "—"}</span>
              <span className="pill">{listing.condition ?? "—"}</span>
            </div>

            <h1
              style={{
                margin: "12px 0 0",
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 950,
                color: "var(--green-900)",
              }}
            >
              {listing.title}
            </h1>

            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 950,
                color: "var(--green-900)",
              }}
            >
              {formatPrice(listing.price_eur)}
            </div>

            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontWeight: 950,
                  color: "var(--green-900)",
                  marginBottom: 8,
                }}
              >
                Description
              </div>
              <div
                style={{
                  color: "var(--text)",
                  fontWeight: 650,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
              >
                {listing.description?.trim()
                  ? listing.description
                  : "No description provided yet."}
              </div>
            </div>
          </section>

          <aside style={{ display: "grid", gap: 12, alignContent: "flex-start" }}>
            <MessageSellerCard listingId={listing.id} listingTitle={listing.title} sellerId={listing.owner_id ?? null} />
            <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, color: "var(--green-900)" }}>Keep browsing</div>
              <div style={{ color: "var(--muted)", fontWeight: 650 }}>Find more in the marketplace.</div>
              <Link className="btn btn-secondary" href="/browse">
                Browse listings
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
