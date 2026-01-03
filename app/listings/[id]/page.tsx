import Link from "next/link";
import ImageCarousel from "@/app/components/ImageCarousel";




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
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function ImageGallery({ title, urls }: { title: string; urls: string[] }) {
  return (
    <div>
      <img
        src={urls[0]}
        alt={title}
        style={{
          width: "100%",
          height: 280,
          objectFit: "cover",
          borderRadius: 18,
          border: "1px solid var(--border)",
        }}
      />

      {urls.length > 1 ? (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 10,
            overflowX: "auto",
            paddingBottom: 6,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {urls.map((u, i) => (
            <a
              key={u}
              href={u}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", flex: "0 0 auto" }}
              aria-label={`Open photo ${i + 1}`}
            >
              <img
                src={u}
                alt={`${title} photo ${i + 1}`}
                style={{
                  width: 96,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "€—";
  return new Intl.NumberFormat("en-IE").format(price) + " €";
}

function labelCategory(cat: Listing["category"]) {
  if (cat === "car") return "Car";
  if (cat === "part") return "Part";
  return "Memorabilia";
}

async function getListing(id: string): Promise<Listing | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("Missing env vars:", {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
    });
    return null;
  }


  const url = new URL("/rest/v1/listings", SUPABASE_URL);
  url.searchParams.set(
    "select",
    "id,title,category,price_eur,location,condition,description,created_at,image_urls"
  );
  url.searchParams.set("id", `eq.${id}`);

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
      "Accept-Profile": "public",
    },
    cache: "no-store",
  });
  if (!res.ok) {
  const text = await res.text();
  console.log("Supabase fetch failed:", res.status, text);
  return null;
}


  if (!res.ok) return null;
  const rows = (await res.json()) as Listing[];
  return rows[0] ?? null;
}

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const listing = await getListing(id);

  return (
    <main className="container">
      <Link className="pill" href="/browse">
        ← Back to Browse
      </Link>

      {!listing ? (
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 950, color: "var(--green-900)" }}>
            Listing not found
          </div>
          <div style={{ color: "var(--muted)", fontWeight: 650 }}>
            This listing may have been removed (or env vars are missing).
          </div>
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

          <aside className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontWeight: 950,
                color: "var(--green-900)",
                marginBottom: 8,
              }}
            >
              Next steps
            </div>
            <div style={{ color: "var(--muted)", fontWeight: 650 }}>
              Messaging comes after login.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 14,
              }}
            >
              <button className="btn btn-primary" disabled>
                Message seller (next)
              </button>
              <Link className="btn btn-secondary" href="/browse">
                Keep browsing
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
