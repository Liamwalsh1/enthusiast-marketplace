"use client";

import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";
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
} from "@/app/lib/constants";
import { optimizeImages, getOptimizedExtension, getOptimizedMimeType } from "@/app/lib/imageUtils";

type Category = "car" | "part" | "memorabilia" | "wheels";

export default function AdminCreateListingPage() {
  const router = useRouter();

  // Auth / admin check
  const [checking, setChecking] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login?next=/admin/listings/new"); return; }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (role?.role !== "admin") { router.replace("/"); return; }

      setAdminId(user.id);
      setChecking(false);
    }
    checkAdmin();
  }, [router]);

  const [category, setCategory] = useState<Category>("car");
  const [title, setTitle] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Used");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Car-specific
  const [make, setMake] = useState("");
  const [customMake, setCustomMake] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [year, setYear] = useState("");
  const [transmission, setTransmission] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [vin, setVin] = useState("");
  const [isModified, setIsModified] = useState<boolean | null>(null);
  const [modifications, setModifications] = useState<string[]>([""]);

  // Wheel-specific
  const [wheelDiameter, setWheelDiameter] = useState("");
  const [wheelWidth, setWheelWidth] = useState("");
  const [boltPattern, setBoltPattern] = useState("");
  const [wheelOffset, setWheelOffset] = useState("");
  const [centerBore, setCenterBore] = useState("");
  const [wheelQuantity, setWheelQuantity] = useState("");
  const [wheelBrand, setWheelBrand] = useState("");
  const [wheelMaterial, setWheelMaterial] = useState("");
  const [wheelStyle, setWheelStyle] = useState("");

  // Seller contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function parsePrice(value: string): number | null {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  async function uploadImages(listingId: string, filesToUpload: File[], ownerId: string) {
    const optimized = await optimizeImages(filesToUpload, {
      maxWidth: 1920,
      maxHeight: 1440,
      quality: 0.82,
      generateBlur: true,
    });

    const ext = getOptimizedExtension();
    const mimeType = getOptimizedMimeType();
    const urls: string[] = [];
    const blurDataUrls: string[] = [];

    for (const img of optimized) {
      const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("listings-images")
        .upload(path, img.blob, { contentType: mimeType });
      if (error) throw error;
      const { data } = supabase.storage.from("listings-images").getPublicUrl(path);
      urls.push(data.publicUrl);
      blurDataUrls.push(img.blurDataUrl);
    }
    return { urls, blurDataUrls };
  }

  async function uploadVideo(listingId: string, video: File, ownerId: string): Promise<string> {
    const ext = video.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("listings-images")
      .upload(path, video, { contentType: video.type });
    if (error) throw error;
    const { data } = supabase.storage.from("listings-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (title.trim().length < 3) {
      setErrorMsg("Title must be at least 3 characters.");
      return;
    }

    const priceInt = parsePrice(priceEur);
    if (priceEur.trim() !== "" && priceInt === null) {
      setErrorMsg("Price must be a valid number.");
      return;
    }

    const resolvedMake = make === "Other" ? customMake.trim() : make.trim();
    const resolvedModel = (make === "Other" || model === "Other") ? customModel.trim() : model.trim();

    if (category === "car") {
      if (!resolvedMake) { setErrorMsg("Please enter the make."); return; }
      if (!resolvedModel) { setErrorMsg("Please enter the model."); return; }
      if (!year.trim()) { setErrorMsg("Please enter the year."); return; }
    }

    if (!adminId) return;
    setIsSubmitting(true);

    const yearInt = year.trim() ? parseInt(year.trim(), 10) : null;
    const mileageInt = mileageKm.trim() ? parseInt(mileageKm.trim(), 10) : null;

    const insertPayload: Record<string, unknown> = {
      title: title.trim(),
      category,
      price_eur: priceInt,
      location: location.trim() || null,
      condition: category !== "car" ? condition.trim() || null : null,
      description: description.trim() || null,
      owner_id: adminId,
      status: "active",
      phone_number: contactPhone.trim() || null,
      show_phone: contactPhone.trim() ? showPhone : false,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
    };

    if (category === "car") {
      insertPayload.make = resolvedMake || null;
      insertPayload.model = resolvedModel || null;
      insertPayload.year = Number.isFinite(yearInt) ? yearInt : null;
      insertPayload.transmission = transmission || null;
      insertPayload.mileage_km = Number.isFinite(mileageInt) ? mileageInt : null;
      insertPayload.vin = vin.trim() || null;
      insertPayload.is_modified = isModified ?? false;
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
        const { urls, blurDataUrls } = await uploadImages(data.id, files.slice(0, 20), adminId);
        updatePayload.image_urls = urls;
        updatePayload.blur_data_urls = blurDataUrls;
      }

      if (videoFile) {
        updatePayload.video_url = await uploadVideo(data.id, videoFile, adminId);
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from("listings").update(updatePayload).eq("id", data.id);
      }

      router.push(`/listings/${data.id}`);
    } catch (err) {
      setIsSubmitting(false);
      const message = err && typeof err === "object" && "message" in err
        ? (err as { message?: string }).message ?? "Listing created but media upload failed."
        : "Listing created but media upload failed.";
      setErrorMsg(message);
    }
  }

  if (checking) {
    return (
      <main className="container">
        <section className="card" style={{ padding: 16, marginTop: 20 }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>Checking access…</div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <Link className="pill" href="/admin/listings">← Back to listings</Link>
      <h1 style={{ fontSize: 34, fontWeight: 950, color: "var(--green-900)", margin: "12px 0 4px" }}>
        Create listing on behalf
      </h1>
      <p style={{ color: "var(--muted)", fontWeight: 650, marginBottom: 20 }}>
        Posts as active immediately. Fill in the seller&apos;s contact details so buyers can reach them directly.
      </p>

      <div className="grid-2">
        <section className="card" style={{ padding: 16 }}>
          <form onSubmit={onSubmit}>

            {/* Category */}
            <label style={styles.label}>Category</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {(["car", "part", "memorabilia", "wheels"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: category === cat ? "var(--green-900)" : "var(--border)",
                    background: category === cat ? "var(--green-900)" : "white",
                    color: category === cat ? "white" : "var(--green-900)",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Title */}
            <label style={styles.label}>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2002 Honda S2000 AP1"
            />

            {/* Car-specific fields */}
            {category === "car" && (
              <>
                <div style={styles.sectionHeader}>Vehicle Details</div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Make</label>
                    <select
                      className="select"
                      value={make}
                      onChange={(e) => { setMake(e.target.value); setModel(""); setCustomMake(""); setCustomModel(""); }}
                    >
                      <option value="">Select make...</option>
                      {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    {make === "Other" && (
                      <input className="input" style={{ marginTop: 8 }} value={customMake} onChange={(e) => setCustomMake(e.target.value)} placeholder="Enter make..." />
                    )}
                  </div>
                  <div>
                    <label style={styles.label}>Model</label>
                    {make === "Other" ? (
                      <input className="input" value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Enter model..." />
                    ) : (
                      <select className="select" value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
                        <option value="">{make ? "Select model..." : "Select make first"}</option>
                        {make && CAR_MODELS_BY_MAKE[make]?.map((m) => <option key={m} value={m}>{m}</option>)}
                        <option value="Other">Other</option>
                      </select>
                    )}
                    {make !== "Other" && model === "Other" && (
                      <input className="input" style={{ marginTop: 8 }} value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Enter model..." />
                    )}
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Year</label>
                    <input className="input" value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="e.g. 1997" />
                  </div>
                  <div>
                    <label style={styles.label}>Mileage (km)</label>
                    <input className="input" value={mileageKm} onChange={(e) => setMileageKm(e.target.value)} inputMode="numeric" placeholder="e.g. 85000" />
                  </div>
                </div>

                <label style={styles.label}>Transmission</label>
                <select className="select" value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>

                <label style={styles.label}>Any modifications?</label>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => { setIsModified(false); setModifications([""]); }}
                    style={{ ...styles.radioOption, ...(isModified === false ? styles.radioOptionSelected : {}) }}>
                    No, stock
                  </button>
                  <button type="button" onClick={() => setIsModified(true)}
                    style={{ ...styles.radioOption, ...(isModified === true ? styles.radioOptionSelected : {}) }}>
                    Yes
                  </button>
                </div>

                {isModified && (
                  <div style={{ marginTop: 8, padding: 12, background: "var(--soft)", borderRadius: 10 }}>
                    <label style={styles.label}>List modifications</label>
                    {modifications.map((mod, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <span style={{ color: "var(--green-900)", fontWeight: 900, fontSize: 18 }}>•</span>
                        <input className="input" value={mod} onChange={(e) => { const n = [...modifications]; n[index] = e.target.value; setModifications(n); }} placeholder="e.g. Coilovers, exhaust…" style={{ flex: 1 }} />
                        {modifications.length > 1 && (
                          <button type="button" onClick={() => setModifications(modifications.filter((_, i) => i !== index))}
                            style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(220,38,38,0.1)", color: "rgb(220,38,38)", fontWeight: 700, fontSize: 18, cursor: "pointer" }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setModifications([...modifications, ""])}
                      style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, border: "1px dashed var(--border)", background: "transparent", fontWeight: 650, fontSize: 13, color: "var(--green-900)", cursor: "pointer" }}>
                      + Add another
                    </button>
                  </div>
                )}

                <label style={styles.label}>VIN (optional)</label>
                <input className="input" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="17-character VIN" maxLength={17} />
              </>
            )}

            {/* Wheel-specific fields */}
            {category === "wheels" && (
              <>
                <div style={styles.sectionHeader}>Wheel Specifications</div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Brand</label>
                    <select className="select" value={wheelBrand} onChange={(e) => setWheelBrand(e.target.value)}>
                      <option value="">Select brand...</option>
                      {WHEEL_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Style/Model</label>
                    <input className="input" value={wheelStyle} onChange={(e) => setWheelStyle(e.target.value)} placeholder="e.g. TE37, RPF1" />
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Diameter (inches)</label>
                    <select className="select" value={wheelDiameter} onChange={(e) => setWheelDiameter(e.target.value)}>
                      <option value="">Select...</option>
                      {WHEEL_DIAMETERS.map((d) => <option key={d} value={d}>{d}&quot;</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Width (inches)</label>
                    <select className="select" value={wheelWidth} onChange={(e) => setWheelWidth(e.target.value)}>
                      <option value="">Select...</option>
                      {WHEEL_WIDTHS.map((w) => <option key={w} value={w}>{w}&quot;</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Bolt Pattern (PCD)</label>
                    <select className="select" value={boltPattern} onChange={(e) => setBoltPattern(e.target.value)}>
                      <option value="">Select...</option>
                      {BOLT_PATTERNS.map((bp) => <option key={bp} value={bp}>{bp}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Offset (ET)</label>
                    <input className="input" value={wheelOffset} onChange={(e) => setWheelOffset(e.target.value)} inputMode="numeric" placeholder="e.g. 35, -10" />
                  </div>
                </div>

                <div className="form-two-col">
                  <div>
                    <label style={styles.label}>Center Bore (mm)</label>
                    <input className="input" value={centerBore} onChange={(e) => setCenterBore(e.target.value)} inputMode="decimal" placeholder="e.g. 67.1" />
                  </div>
                  <div>
                    <label style={styles.label}>Quantity</label>
                    <select className="select" value={wheelQuantity} onChange={(e) => setWheelQuantity(e.target.value)}>
                      <option value="">Select...</option>
                      {WHEEL_QUANTITIES.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                </div>

                <label style={styles.label}>Material</label>
                <select className="select" value={wheelMaterial} onChange={(e) => setWheelMaterial(e.target.value)}>
                  <option value="">Select...</option>
                  {WHEEL_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </>
            )}

            {/* Shared fields */}
            <label style={styles.label}>Price (EUR)</label>
            <input className="input" value={priceEur} onChange={(e) => setPriceEur(e.target.value)} inputMode="numeric" placeholder="e.g. 29500" />

            <label style={styles.label}>Location</label>
            <select className="select" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Select county...</option>
              {IRISH_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}
            </select>

            {category !== "car" && (
              <>
                <label style={styles.label}>Condition</label>
                <select className="select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option>New</option>
                  <option>Used</option>
                  <option>Refurbished</option>
                </select>
              </>
            )}

            <label style={styles.label}>Description</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Spec, history, condition, extras…" />

            {/* Seller contact section */}
            <div style={styles.sectionHeader}>Seller Contact Details</div>
            <p style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13, marginBottom: 8 }}>
              These details will be shown publicly on the listing so buyers can contact the seller directly.
            </p>

            <label style={styles.label}>Seller Name</label>
            <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. John Murphy" />

            <label style={styles.label}>Seller Phone</label>
            <input className="input" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. 085 123 4567" />
            {contactPhone.trim() && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, cursor: "pointer", fontSize: 14, fontWeight: 650, color: "var(--text)" }}>
                <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                Show phone number on listing
              </label>
            )}

            <label style={styles.label}>Seller Email</label>
            <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g. john@example.com" />

            {/* Media */}
            <div style={styles.sectionHeader}>Photos & Video</div>

            <label style={styles.label}>Photos (up to 20)</label>
            <input className="input" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            {files.length > 0 && <div style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13, marginTop: 6 }}>{files.length} photo(s) selected</div>}

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
            {videoFile && <div style={{ color: "var(--muted)", fontWeight: 650, fontSize: 13, marginTop: 6 }}>{videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)}MB)</div>}

            {errorMsg && (
              <div className="card" style={{ marginTop: 12, padding: 12, border: "1px solid rgba(220,38,38,.3)", background: "rgba(220,38,38,.08)" }}>
                {errorMsg}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
              {isSubmitting ? "Creating…" : "Create listing (goes live immediately)"}
            </button>
          </form>
        </section>

        <aside className="card" style={{ padding: 16, alignSelf: "start" }}>
          <div style={{ fontWeight: 900, color: "var(--green-900)" }}>Admin note</div>
          <ul style={{ marginTop: 10, paddingLeft: 18, color: "var(--muted)", fontWeight: 650, lineHeight: 1.7 }}>
            <li>This listing goes live immediately — no approval needed.</li>
            <li>It will appear under your admin account.</li>
            <li>Seller contact details are shown publicly on the listing.</li>
            <li>You can edit or delete it at any time from the listings table.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: { marginTop: 10, fontWeight: 800, display: "block", color: "var(--green-900)" },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottom: "1px solid var(--border)",
    fontWeight: 900,
    fontSize: 16,
    color: "var(--green-900)",
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
  },
  radioOptionSelected: {
    background: "var(--green-900)",
    borderColor: "var(--green-900)",
    color: "white",
  },
};
