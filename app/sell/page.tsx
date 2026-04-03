"use client";

import type { FormEvent } from "react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import {
  IRISH_COUNTIES,
  CAR_MAKES,
  CAR_MODELS_BY_MAKE,
  WHEEL_DIAMETERS,
  WHEEL_WIDTHS,
  BOLT_PATTERNS,
  WHEEL_BRANDS,
  WHEEL_MATERIALS,
  WHEEL_QUANTITIES,
} from "../lib/constants";
import { optimizeImages, getOptimizedExtension, getOptimizedMimeType } from "../lib/imageUtils";

type Category = "car" | "part" | "memorabilia" | "wheels";

// Wrapper component to handle Suspense for useSearchParams
export default function SellPage() {
  return (
    <Suspense fallback={
      <main className="container">
        <section className="card" style={{ padding: 16, marginTop: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>Loading...</div>
        </section>
      </main>
    }>
      <SellPageContent />
    </Suspense>
  );
}

function SellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial category from URL param, default to "car"
  const urlCategory = searchParams.get("category") as Category | null;
  const validCategories: Category[] = ["car", "part", "memorabilia", "wheels"];
  const initialCategory = urlCategory && validCategories.includes(urlCategory) ? urlCategory : "car";

  const category = initialCategory;
  const [title, setTitle] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Used");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Car-specific fields
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [transmission, setTransmission] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [vin, setVin] = useState("");
  const [isModified, setIsModified] = useState<boolean | null>(null);
  const [modifications, setModifications] = useState<string[]>([""]);

  // Wheel-specific fields
  const [wheelDiameter, setWheelDiameter] = useState("");
  const [wheelWidth, setWheelWidth] = useState("");
  const [boltPattern, setBoltPattern] = useState("");
  const [wheelOffset, setWheelOffset] = useState("");
  const [centerBore, setCenterBore] = useState("");
  const [wheelQuantity, setWheelQuantity] = useState("");
  const [wheelBrand, setWheelBrand] = useState("");
  const [wheelMaterial, setWheelMaterial] = useState("");
  const [wheelStyle, setWheelStyle] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.error("Session lookup failed:", error);
        setErrorMsg("Could not verify session.");
      }

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setCheckingSession(false);

      if (!sessionUser) {
        router.replace(`/login?next=${encodeURIComponent("/sell")}`);
      }
    }

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        router.replace(`/login?next=${encodeURIComponent("/sell")}`);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  function parsePrice(value: string): number | null {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  async function uploadImages(listingId: string, filesToUpload: File[], ownerId: string) {
    const urls: string[] = [];
    const blurDataUrls: string[] = [];

    // Optimize all images (compress, resize, convert to WebP)
    const optimizedImages = await optimizeImages(filesToUpload, {
      maxWidth: 1920,
      maxHeight: 1440,
      quality: 0.82,
      generateBlur: true,
    });

    const ext = getOptimizedExtension();
    const mimeType = getOptimizedMimeType();

    for (const optimized of optimizedImages) {
      const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("listings-images")
        .upload(path, optimized.blob, { contentType: mimeType });

      if (error) {
        console.error("Image upload failed:", error);
        throw error;
      }

      const { data } = supabase.storage.from("listings-images").getPublicUrl(path);
      urls.push(data.publicUrl);
      blurDataUrls.push(optimized.blurDataUrl);
    }

    return { urls, blurDataUrls };
  }

  async function uploadVideo(listingId: string, video: File, ownerId: string): Promise<string> {
    const ext = video.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("listings-images")
      .upload(path, video, { contentType: video.type });

    if (error) {
      console.error("Video upload failed:", error);
      throw error;
    }

    const { data } = supabase.storage.from("listings-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (title.trim().length < 6) {
      setErrorMsg("Title must be at least 6 characters.");
      return;
    }

    if (files.length === 0) {
      setErrorMsg("Please add at least one image.");
      return;
    }

    const priceInt = parsePrice(priceEur);
    if (priceEur.trim() !== "" && priceInt === null) {
      setErrorMsg("Price must be a valid number.");
      return;
    }

    // Car-specific validation
    if (category === "car") {
      if (!make.trim()) {
        setErrorMsg("Please select a make.");
        return;
      }
      if (!model.trim()) {
        setErrorMsg("Please select a model.");
        return;
      }
      if (!year.trim()) {
        setErrorMsg("Please enter the year.");
        return;
      }
      if (!mileageKm.trim()) {
        setErrorMsg("Please enter the mileage.");
        return;
      }
      if (!transmission) {
        setErrorMsg("Please select a transmission type.");
        return;
      }
      if (isModified === null) {
        setErrorMsg("Please indicate if the car has been modified.");
        return;
      }
    }

    // Wheels-specific validation
    if (category === "wheels") {
      if (!wheelDiameter) {
        setErrorMsg("Please select a wheel diameter.");
        return;
      }
      if (!wheelWidth) {
        setErrorMsg("Please select a wheel width.");
        return;
      }
      if (!wheelQuantity) {
        setErrorMsg("Please select the quantity.");
        return;
      }
    }

    setIsSubmitting(true);

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/sell")}`);
      setIsSubmitting(false);
      return;
    }

    // Parse car-specific numeric fields
    const yearInt = year.trim() ? parseInt(year.trim(), 10) : null;
    const mileageInt = mileageKm.trim() ? parseInt(mileageKm.trim(), 10) : null;

    // Build insert payload - only include car specs if category is "car"
    // New listings start as 'pending' until admin approval
    const insertPayload: Record<string, unknown> = {
      title: title.trim(),
      category,
      price_eur: priceInt,
      location: location.trim() || null,
      condition: condition.trim() || null,
      description: description.trim() || null,
      owner_id: user.id,
      status: "pending",
    };

    if (category === "car") {
      insertPayload.make = make.trim() || null;
      insertPayload.model = model.trim() || null;
      insertPayload.year = Number.isFinite(yearInt) ? yearInt : null;
      insertPayload.transmission = transmission || null;
      insertPayload.mileage_km = Number.isFinite(mileageInt) ? mileageInt : null;
      insertPayload.vin = vin.trim() || null;
      insertPayload.is_modified = isModified ?? false;
      // Filter out empty modifications
      const filteredMods = modifications.filter((m) => m.trim() !== "");
      insertPayload.modifications = filteredMods.length > 0 ? filteredMods : null;
    }

    if (category === "wheels") {
      const diameterNum = wheelDiameter ? parseFloat(wheelDiameter) : null;
      const widthNum = wheelWidth ? parseFloat(wheelWidth) : null;
      const offsetNum = wheelOffset.trim() ? parseInt(wheelOffset.trim(), 10) : null;
      const boreNum = centerBore.trim() ? parseFloat(centerBore.trim()) : null;
      const qtyNum = wheelQuantity === "5+" ? 5 : wheelQuantity ? parseInt(wheelQuantity, 10) : null;

      insertPayload.wheel_diameter = Number.isFinite(diameterNum) ? diameterNum : null;
      insertPayload.wheel_width = Number.isFinite(widthNum) ? widthNum : null;
      insertPayload.bolt_pattern = boltPattern || null;
      insertPayload.wheel_offset = Number.isFinite(offsetNum) ? offsetNum : null;
      insertPayload.center_bore = Number.isFinite(boreNum) ? boreNum : null;
      insertPayload.wheel_quantity = Number.isFinite(qtyNum) ? qtyNum : null;
      insertPayload.wheel_brand = wheelBrand || null;
      insertPayload.wheel_material = wheelMaterial || null;
      insertPayload.wheel_style = wheelStyle.trim() || null;
    }

    const { data, error } = await supabase
      .from("listings")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error || !data?.id) {
      setIsSubmitting(false);
      setErrorMsg(error?.message ?? "Failed to create listing.");
      return;
    }

    try {
      const updatePayload: Record<string, unknown> = {};

      if (files.length > 0) {
        const { urls: imageUrls, blurDataUrls } = await uploadImages(data.id, files.slice(0, 20), user.id);
        updatePayload.image_urls = imageUrls;
        updatePayload.blur_data_urls = blurDataUrls;
      }

      if (videoFile) {
        const videoUrl = await uploadVideo(data.id, videoFile, user.id);
        updatePayload.video_url = videoUrl;
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateErr } = await supabase
          .from("listings")
          .update(updatePayload)
          .eq("id", data.id);

        if (updateErr) throw updateErr;
      }

      // Notify admin of new listing
      try {
        await fetch("/api/listings/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: data.id }),
        });
      } catch {
        // Ignore errors - admin notification is non-critical
      }

      router.push(`/listings/${data.id}?submitted=true`);
    } catch (err) {
      setIsSubmitting(false);
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: string }).message === "string"
          ? (err as { message?: string }).message ?? "Listing created, but media upload failed."
          : "Listing created, but media upload failed.";
      setErrorMsg(message);
    }
  }

  if (checkingSession) {
    return (
      <main className="container">
        <section className="card" style={{ padding: 16, marginTop: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>Checking session…</div>
          <div style={{ color: "var(--muted)", fontWeight: 650, marginTop: 6 }}>
            Redirecting you to sign in if needed.
          </div>
        </section>
      </main>
    );
  }

  const categoryLabels: Record<Category, string> = {
    car: "Car",
    wheels: "Wheels",
    part: "Parts",
    memorabilia: "Memorabilia",
  };

  return (
    <main className="container">
      <div style={styles.categoryHeading}>{categoryLabels[category]}</div>
      <h1 style={styles.h1}>Post an ad</h1>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <section className="card" style={styles.card}>
          <form onSubmit={onSubmit}>
            <label style={styles.label}>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2002 Honda S2000 AP1"
            />

            {category === "car" && (
              <>
                <div style={styles.sectionHeader}>Vehicle Details</div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Make</label>
                    <select
                      className="select"
                      value={make}
                      onChange={(e) => {
                        setMake(e.target.value);
                        setModel(""); // Reset model when make changes
                      }}
                    >
                      <option value="">Select make...</option>
                      {CAR_MAKES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Model</label>
                    <select
                      className="select"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={!make}
                    >
                      <option value="">{make ? "Select model..." : "Select make first"}</option>
                      {make && CAR_MODELS_BY_MAKE[make]?.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Year</label>
                    <input
                      className="input"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      inputMode="numeric"
                      placeholder="e.g. 1989"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Mileage (km)</label>
                    <input
                      className="input"
                      value={mileageKm}
                      onChange={(e) => setMileageKm(e.target.value)}
                      inputMode="numeric"
                      placeholder="e.g. 85000"
                    />
                  </div>
                </div>

                <label style={styles.label}>Transmission</label>
                <select
                  className="select"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>

                <label style={styles.label}>Any modifications made?</label>
                <div style={styles.radioGroup}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModified(false);
                      setModifications([""]);
                    }}
                    style={{
                      ...styles.radioOption,
                      ...(isModified === false ? styles.radioOptionSelected : {}),
                    }}
                  >
                    No, it's stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModified(true)}
                    style={{
                      ...styles.radioOption,
                      ...(isModified === true ? styles.radioOptionSelected : {}),
                    }}
                  >
                    Yes
                  </button>
                </div>

                {isModified && (
                  <div style={styles.modificationsSection}>
                    <label style={styles.label}>List modifications</label>
                    {modifications.map((mod, index) => (
                      <div key={index} style={styles.modificationRow}>
                        <span style={styles.bullet}>•</span>
                        <input
                          className="input"
                          value={mod}
                          onChange={(e) => {
                            const newMods = [...modifications];
                            newMods[index] = e.target.value;
                            setModifications(newMods);
                          }}
                          placeholder="e.g. Coilovers, exhaust, ECU tune..."
                          style={{ flex: 1 }}
                        />
                        {modifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newMods = modifications.filter((_, i) => i !== index);
                              setModifications(newMods);
                            }}
                            style={styles.removeBtn}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setModifications([...modifications, ""])}
                      style={styles.addModBtn}
                    >
                      + Add another
                    </button>
                  </div>
                )}

                <label style={styles.label}>VIN (optional)</label>
                <input
                  className="input"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="17-character VIN"
                  maxLength={17}
                />
              </>
            )}

            {category === "wheels" && (
              <>
                <div style={styles.sectionHeader}>Wheel Specifications</div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Brand</label>
                    <select
                      className="select"
                      value={wheelBrand}
                      onChange={(e) => setWheelBrand(e.target.value)}
                    >
                      <option value="">Select brand...</option>
                      {WHEEL_BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Style/Model</label>
                    <input
                      className="input"
                      value={wheelStyle}
                      onChange={(e) => setWheelStyle(e.target.value)}
                      placeholder="e.g. TE37, RPF1, RS"
                    />
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Diameter (inches)</label>
                    <select
                      className="select"
                      value={wheelDiameter}
                      onChange={(e) => setWheelDiameter(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {WHEEL_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          {d}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Width (inches)</label>
                    <select
                      className="select"
                      value={wheelWidth}
                      onChange={(e) => setWheelWidth(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {WHEEL_WIDTHS.map((w) => (
                        <option key={w} value={w}>
                          {w}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Bolt Pattern (PCD)</label>
                    <select
                      className="select"
                      value={boltPattern}
                      onChange={(e) => setBoltPattern(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {BOLT_PATTERNS.map((bp) => (
                        <option key={bp} value={bp}>
                          {bp}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Offset (ET)</label>
                    <input
                      className="input"
                      value={wheelOffset}
                      onChange={(e) => setWheelOffset(e.target.value)}
                      inputMode="numeric"
                      placeholder="e.g. 35, -10"
                    />
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Center Bore (mm)</label>
                    <input
                      className="input"
                      value={centerBore}
                      onChange={(e) => setCenterBore(e.target.value)}
                      inputMode="decimal"
                      placeholder="e.g. 67.1, 73.1"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Quantity</label>
                    <select
                      className="select"
                      value={wheelQuantity}
                      onChange={(e) => setWheelQuantity(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {WHEEL_QUANTITIES.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label style={styles.label}>Material</label>
                <select
                  className="select"
                  value={wheelMaterial}
                  onChange={(e) => setWheelMaterial(e.target.value)}
                >
                  <option value="">Select...</option>
                  {WHEEL_MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label style={styles.label}>Price (EUR)</label>
            <input
              className="input"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 29500"
            />

            <label style={styles.label}>Location</label>
            <select
              className="select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select county...</option>
              {IRISH_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>

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

            <label style={styles.label}>Photos (up to 20)</label>
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

            <label style={styles.label}>Video (optional, max 100MB)</label>
            <input
              className="input"
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > 100 * 1024 * 1024) {
                  setErrorMsg("Video must be under 100MB");
                  e.target.value = "";
                  return;
                }
                setVideoFile(file);
              }}
            />

            {videoFile && (
              <div style={styles.smallText}>
                Video selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)}MB)
              </div>
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
  categoryHeading: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--green-900)",
    textDecoration: "underline",
    textUnderlineOffset: 4,
    marginBottom: 4,
  },
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
  sectionHeader: {
    marginTop: 20,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottom: "1px solid var(--border)",
    fontWeight: 900,
    fontSize: 16,
    color: "var(--green-900)",
  },
  radioGroup: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },
  radioOption: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    background: "white",
    fontWeight: 650,
    fontSize: 14,
    color: "var(--green-900)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  radioOptionSelected: {
    background: "var(--green-900)",
    borderColor: "var(--green-900)",
    color: "white",
  },
  modificationsSection: {
    marginTop: 8,
    padding: 12,
    background: "var(--soft)",
    borderRadius: 10,
  },
  modificationRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  bullet: {
    color: "var(--green-900)",
    fontWeight: 900,
    fontSize: 18,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "none",
    background: "rgba(220, 38, 38, 0.1)",
    color: "rgb(220, 38, 38)",
    fontWeight: 700,
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  addModBtn: {
    marginTop: 10,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px dashed var(--border)",
    background: "transparent",
    fontWeight: 650,
    fontSize: 13,
    color: "var(--green-900)",
    cursor: "pointer",
  },
};
