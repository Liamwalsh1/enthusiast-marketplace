"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/useToast";
import { IRISH_COUNTIES, CAR_MAKES, CAR_MODELS_BY_MAKE } from "@/app/lib/constants";
import { ensureServerSession } from "@/app/lib/auth/ensureServerSession";

type Category = "car" | "part" | "memorabilia" | "";

export default function CreateAlertForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("");
  const [transmission, setTransmission] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!name.trim()) {
      toast({ type: "error", message: "Please enter an alert name" });
      return;
    }

    setLoading(true);

    try {
      const synced = await ensureServerSession();
      if (!synced) {
        toast({ type: "error", message: "Your session expired. Please sign in again." });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category || null,
          make: make || null,
          model: model || null,
          year_min: yearMin ? parseInt(yearMin, 10) : null,
          year_max: yearMax ? parseInt(yearMax, 10) : null,
          price_min: priceMin ? parseInt(priceMin, 10) : null,
          price_max: priceMax ? parseInt(priceMax, 10) : null,
          location: location || null,
          transmission: transmission || null,
          email_notifications: emailNotifications,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create alert");
      }

      toast({ type: "success", message: "Alert created" });

      // Reset form
      setName("");
      setCategory("");
      setMake("");
      setModel("");
      setYearMin("");
      setYearMax("");
      setPriceMin("");
      setPriceMax("");
      setLocation("");
      setTransmission("");
      setEmailNotifications(true);
      setExpanded(false);

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create alert";
      toast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Alert Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Classic Ford Mustang"
            maxLength={100}
            disabled={loading}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setExpanded(!expanded)}
          style={{ alignSelf: "flex-end" }}
        >
          {expanded ? "Less options" : "More options"}
        </button>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Category</label>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            disabled={loading}
          >
            <option value="">All categories</option>
            <option value="car">Car</option>
            <option value="part">Part</option>
            <option value="memorabilia">Memorabilia</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Make</label>
          <select
            className="select"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
            disabled={loading}
          >
            <option value="">All makes</option>
            {CAR_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Model</label>
          <select
            className="select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading || !make}
          >
            <option value="">{make ? "All models" : "Select make first"}</option>
            {make &&
              CAR_MODELS_BY_MAKE[make]?.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
        </div>
      </div>

      {expanded && (
        <>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Year (min)</label>
              <input
                className="input"
                type="number"
                value={yearMin}
                onChange={(e) => setYearMin(e.target.value)}
                placeholder="e.g. 1965"
                disabled={loading}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Year (max)</label>
              <input
                className="input"
                type="number"
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value)}
                placeholder="e.g. 1970"
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Price min (EUR)</label>
              <input
                className="input"
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="e.g. 10000"
                disabled={loading}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Price max (EUR)</label>
              <input
                className="input"
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="e.g. 50000"
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Location</label>
              <select
                className="select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              >
                <option value="">All locations</option>
                {IRISH_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Transmission</label>
              <select
                className="select"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                disabled={loading}
              >
                <option value="">All</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="Semi-Automatic">Semi-Automatic</option>
                <option value="CVT">CVT</option>
              </select>
            </div>
          </div>

          <div>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                disabled={loading}
              />
              <span>Email me when new listings match</span>
            </label>
          </div>
        </>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Alert"}
      </button>
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  field: { flex: 1, minWidth: 150 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 650,
    color: "var(--green-900)",
    cursor: "pointer",
  },
};
