"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Category = "car" | "part" | "memorabilia";

export default function SellPage() {
  const router = useRouter();

  const [category, setCategory] = useState<Category>("car");
  const [title, setTitle] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Used");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function parsePrice(value: string): number | null {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  async function uploadImages(listingId: string, filesToUpload: File[]) {
    const urls: string[] = [];

    for (const file of filesToUpload) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${listingId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("listings-images")
        .upload(path, file, { contentType: file.type });

      if (error) {
        console.error("Image upload failed:", error);
        throw error;
      }

      const { data } = supabase.storage.from("listings-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (title.trim().length < 6) {
      setErrorMsg("Title must be at least 6 characters.");
      return;
    }

    const priceInt = parsePrice(priceEur);
    if (priceEur.trim() !== "" && priceInt === null) {
      setErrorMsg("Price must be a valid number.");
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

    if (error || !data?.id) {
      setIsSubmitting(false);
      setErrorMsg(error?.message ?? "Failed to create listing.");
      return;
    }

    try {
      if (files.length > 0) {
        const imageUrls = await uploadImages(data.id, files.slice(0, 5));

        const { error: updateErr } = await supabase
          .from("listings")
          .update({ image_urls: imageUrls })
          .eq("id", data.id);

        if (updateErr) throw updateErr;
      }

      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message ?? "Listing created, but image upload failed.");
    }
  }

  return (
    <main className="container">
      <h1 style={styles.h1}>Post an ad</h1>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <section className="card" style={styles.card}>
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

            <label style={styles.label}>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2002 Honda S2000 AP1"
            />

            <label style={styles.label}>Price (EUR)</label>
            <input
              className="input"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 29500"
            />

            <label style={styles.label}>Location</label>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dublin"
            />

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

            <label style={styles.label}>Description</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spec, history, condition, extras…"
            />

            <label style={styles.label}>Photos (up to 5)</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />

            {files.length > 0 && (
              <div style={styles.smallText}>{files.length} photo(s) selected</div>
            )}

            {errorMsg && (
              <div className="card" style={styles.errorBox}>
                {errorMsg}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
              style={{ marginTop: 12 }}
            >
              {isSubmitting ? "Posting…" : "Post ad"}
            </button>
          </form>
        </section>

        <aside className="card" style={styles.card}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>Tips</div>
          <ul style={styles.ul}>
            <li>Clear photos sell faster</li>
            <li>Show flaws honestly</li>
            <li>Add provenance if possible</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  h1: { fontSize: 34, fontWeight: 950, color: "var(--green-900)" },
  card: { padding: 16 },
  label: { marginTop: 10, fontWeight: 800, display: "block", color: "var(--green-900)" },
  smallText: { color: "var(--muted)", fontWeight: 650, fontSize: 13, marginTop: 6 },
  ul: { marginTop: 10, paddingLeft: 18, color: "var(--muted)", fontWeight: 650 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    border: "1px solid rgba(220,38,38,.3)",
    background: "rgba(220,38,38,.08)",
  },
};
