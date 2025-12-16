"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Category = "car" | "part" | "memorabilia";

export default function SellPage() {
  const router = useRouter();

  const [category, setCategory] = useState<Category>("car");
  const [title, setTitle] = useState("");
  const [priceEur, setPriceEur] = useState<string>("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Used");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function parsePriceToInt(value: string): number | null {
    // allow "12,345" or "12345"
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return null;
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (title.trim().length < 6) {
      setErrorMsg("Title is too short (try at least 6 characters).");
      return;
    }

    const priceInt = parsePriceToInt(priceEur);
    if (priceEur.trim() !== "" && priceInt === null) {
      setErrorMsg("Price must be a number (e.g. 15000).");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("listings")
      .insert({
        title: title.trim(),
        category,
        price_eur: priceInt,
        location: location.trim() || null,
        condition: condition.trim() || null,
        description: description.trim() || null,
      })
      .select("id")
      .single();

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Listing posted! Redirecting to Browse…");

    // Option A: go to browse (simple)
    setTimeout(() => router.push("/browse"), 500);

    // Option B (later): go straight to the listing detail
    // if (data?.id) router.push(`/listings/${data.id}`);
  }

  return (
    <main className="container">
      <h1 style={styles.h1}>Post an ad</h1>
      <p style={styles.p}>
        This will create a real listing in Supabase and it will appear on Browse.
      </p>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <section className="card" style={styles.card}>
          <div style={styles.sectionTitle}>Listing details</div>

          <form onSubmit={onSubmit}>
            <label style={styles.label}>Category</label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="car">Car</option>
              <option value="part">Part</option>
              <option value="memorabilia">Memorabilia</option>
            </select>

            <div style={styles.row}>
              <div>
                <label style={styles.label}>Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2002 Honda S2000 AP1 (UK Import)"
                />
              </div>
              <div>
                <label style={styles.label}>Price (EUR)</label>
                <input
                  className="input"
                  value={priceEur}
                  onChange={(e) => setPriceEur(e.target.value)}
                  placeholder="e.g. 29500"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div style={styles.row}>
              <div>
                <label style={styles.label}>Location</label>
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dublin"
                />
              </div>
              <div>
                <label style={styles.label}>Condition</label>
                <select
                  className="select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option>New</option>
                  <option>Used</option>
                  <option>Refurbished</option>
                </select>
              </div>
            </div>

            <label style={styles.label}>Description</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add the details enthusiasts care about: spec, history, condition, extras…"
            />

            {errorMsg ? (
              <div style={styles.errorBox} className="card">
                <div style={{ fontWeight: 950 }}>Couldn’t post listing</div>
                <div style={{ marginTop: 6 }}>{errorMsg}</div>
              </div>
            ) : null}

            {successMsg ? (
              <div style={styles.successBox} className="card">
                <div style={{ fontWeight: 950 }}>Success</div>
                <div style={{ marginTop: 6 }}>{successMsg}</div>
              </div>
            ) : null}

            <div style={styles.actions}>
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting…" : "Post ad"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setTitle("");
                  setPriceEur("");
                  setLocation("");
                  setCondition("Used");
                  setDescription("");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                disabled={isSubmitting}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <aside className="card" style={styles.card}>
          <div style={styles.sectionTitle}>Photos (next step)</div>
          <p style={styles.smallText}>
            Next we’ll add Supabase Storage so you can upload images and show them on the listing page.
          </p>

          <div style={styles.uploadBox}>
            <div style={{ fontWeight: 850, color: "var(--green-900)" }}>Upload photos</div>
            <div style={styles.smallText}>Drag & drop or click (coming next)</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.sectionTitle}>Posting tips</div>
            <ul style={styles.ul}>
              <li>Use a clean title with year + model</li>
              <li>Be honest about faults (trust wins)</li>
              <li>Add provenance: service history / receipts</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  p: { margin: "6px 0 0", color: "var(--muted)", fontWeight: 650, maxWidth: 780 },
  card: { padding: 16 },
  sectionTitle: { fontWeight: 950, color: "var(--green-900)", marginBottom: 10 },
  label: { display: "block", marginTop: 10, marginBottom: 6, fontWeight: 800, color: "var(--green-900)" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  uploadBox: {
    marginTop: 6,
    borderRadius: 16,
    border: "1px dashed var(--border)",
    background: "var(--soft)",
    padding: 16,
  },
  smallText: { color: "var(--muted)", fontWeight: 650, fontSize: 13, marginTop: 6 },
  ul: { margin: 10, paddingLeft: 18, color: "var(--muted)", fontWeight: 650 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    border: "1px solid rgba(220, 38, 38, 0.25)",
    background: "rgba(220, 38, 38, 0.06)",
    color: "var(--text)",
    boxShadow: "none",
  },
  successBox: {
    marginTop: 12,
    padding: 12,
    border: "1px solid rgba(20, 80, 44, 0.25)",
    background: "rgba(20, 80, 44, 0.06)",
    color: "var(--text)",
    boxShadow: "none",
  },
};
