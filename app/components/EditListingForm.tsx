"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useToast } from "@/app/components/useToast";

type Props = {
  listingId: string;
  initialTitle: string;
  initialPrice: number | null;
  initialDescription: string;
};

export default function EditListingForm({ listingId, initialTitle, initialPrice, initialDescription }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [price, setPrice] = useState(initialPrice?.toString() ?? "");
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);

    const nextTitle = title.trim();
    const nextDescription = description.trim();
    const priceValue = price.trim();
    const nextPrice = priceValue === "" ? null : Number(priceValue);
    if (priceValue !== "" && Number.isNaN(nextPrice)) {
      setError("Price must be a number.");
      toast({ type: "error", message: "Price must be a number." });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("listings")
      .update({ title: nextTitle || null, price_eur: nextPrice, description: nextDescription || null })
      .eq("id", listingId);

    if (error) {
      setError(error.message);
      toast({ type: "error", message: error.message });
      setLoading(false);
      return;
    }

    toast({ type: "success", message: "Listing updated" });
    setLoading(false);
    router.push(`/listings/${listingId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <label style={{ fontWeight: 800, color: "var(--green-900)" }}>Title</label>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />

      <label style={{ fontWeight: 800, color: "var(--green-900)" }}>Price (EUR)</label>
      <input
        className="input"
        type="number"
        step="1"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={loading}
      />

      <label style={{ fontWeight: 800, color: "var(--green-900)" }}>Description</label>
      <textarea
        className="textarea"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
      />

      {error ? (
        <div className="card" style={errorStyles}>
          {error}
        </div>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

const errorStyles = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.3)",
  background: "rgba(220,38,38,.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
};
