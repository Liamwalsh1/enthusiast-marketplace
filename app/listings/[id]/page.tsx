import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  category: "car" | "part" | "memorabilia";
  price_eur: number | null;
  location: string | null;
  condition: string | null;
  description: string | null;
  created_at: string;
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

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getListing(id: string): Promise<Listing | null> {
  const url = new URL("/rest/v1/listings", SUPABASE_URL);
  url.searchParams.set(
    "select",
    "id,title,category,price_eur,location,condition,description,created_at"
  );
  url.searchParams.set("id", `eq.${id}`);

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as Listing[];
  return rows[0] ?? null;
}

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;

  if (!isUuid(id)) {
    return (
      <main className="container">
        <Link className="pill" href="/browse">← Back to Browse</Link>
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={styles.title}>Invalid listing ID</div>
          <div style={styles.muted}>This doesn’t look like a valid listing link.</div>
        </section>
      </main>
    );
  }

  const listing = await getListing(id);

  if (!listing) {
    return (
      <main className="container">
        <Link className="pill" href="/browse">← Back to Browse</Link>
        <section className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={styles.title}>Listing not found</div>
          <div style={styles.muted}>
            It may have been removed, or the link is wrong.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <Link className="pill" href="/browse">← Back to Browse</Link>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <section className="card" style={styles.card}>
          <div style={styles.photoBox}>Photos coming next (Supabase Storage)</div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="pill">{labelCategory(listing.category)}</span>
            <span className="pill">{listing.location ?? "—"}</span>
            <span className="pill">{listing.condition ?? "—"}</span>
          </div>

          <h1 style={styles.h1}>{listing.title}</h1>
          <div style={styles.price}>{formatPrice(listing.price_eur)}</div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Description</div>
            <div style={styles.desc}>
              {listing.description?.trim()
                ? listing.description
                : "No description provided yet."}
            </div>
          </div>
        </section>

        <aside className="card" style={styles.card}>
          <div style={styles.sectionTitle}>Next steps</div>
          <div style={styles.muted}>
            We’ll add sellers + messaging after we add login.
          </div>

          <div style={styles.actions}>
            <button className="btn btn-primary" disabled>
              Message seller (next)
            </button>
            <Link className="btn btn-secondary" href="/browse">
              Keep browsing
            </Link>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Safety</div>
            <ul style={styles.ul}>
              <li>Meet in a safe place</li>
              <li>Verify receipts / provenance where relevant</li>
              <li>Use on-platform messaging (coming next)</li>
            </ul>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Listing info</div>
            <div style={styles.metaRow}><span>Listing ID</span><code>{listing.id}</code></div>
            <div style={styles.metaRow}><span>Created</span><span>{new Date(listing.created_at).toLocaleString("en-IE")}</span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { padding: 16 },
  photoBox: {
    height: 280,
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--soft)",
    display: "grid",
    placeItems: "center",
    color: "var(--muted)",
    fontWeight: 750,
  },
  h1: { margin: "12px 0 0", fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  price: { marginTop: 8, fontSize: 22, fontWeight: 950, color: "var(--green-900)" },
  sectionTitle: { fontWeight: 950, color: "var(--green-900)", marginBottom: 8 },
  desc: { color: "var(--text)", fontWeight: 650, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  muted: { color: "var(--muted)", fontWeight: 650 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  ul: { margin: 10, paddingLeft: 18, color: "var(--muted)", fontWeight: 650 },
  title: { fontWeight: 950, color: "var(--green-900)", fontSize: 18 },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid var(--border)",
    color: "var(--muted)",
    fontWeight: 650,
  },
};
