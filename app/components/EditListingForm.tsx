"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useToast } from "@/app/components/useToast";
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

type Props = {
  listingId: string;
  ownerId: string;
  category: string;
  initialTitle: string;
  initialPrice: number | null;
  initialLocation: string;
  initialDescription: string;
  initialMake: string;
  initialModel: string;
  initialYear: number | null;
  initialEngineCc: number | null;
  initialEngineType: string;
  initialTransmission: string;
  initialMileageKm: number | null;
  initialVin: string;
  initialImageUrls: string[];
  // Wheel-specific props
  initialWheelDiameter: number | null;
  initialWheelWidth: number | null;
  initialBoltPattern: string;
  initialWheelOffset: number | null;
  initialCenterBore: number | null;
  initialWheelQuantity: number | null;
  initialWheelBrand: string;
  initialWheelMaterial: string;
  initialWheelStyle: string;
};

export default function EditListingForm({
  listingId,
  ownerId,
  category,
  initialTitle,
  initialPrice,
  initialLocation,
  initialDescription,
  initialMake,
  initialModel,
  initialYear,
  initialEngineCc,
  initialEngineType,
  initialTransmission,
  initialMileageKm,
  initialVin,
  initialImageUrls,
  initialWheelDiameter,
  initialWheelWidth,
  initialBoltPattern,
  initialWheelOffset,
  initialCenterBore,
  initialWheelQuantity,
  initialWheelBrand,
  initialWheelMaterial,
  initialWheelStyle,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [price, setPrice] = useState(initialPrice?.toString() ?? "");
  const [location, setLocation] = useState(initialLocation);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Car-specific fields
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState(initialYear?.toString() ?? "");
  const [engineCc, setEngineCc] = useState(initialEngineCc?.toString() ?? "");
  const [engineType, setEngineType] = useState(initialEngineType);
  const [transmission, setTransmission] = useState(initialTransmission);
  const [mileageKm, setMileageKm] = useState(initialMileageKm?.toString() ?? "");
  const [vin, setVin] = useState(initialVin);

  // Wheel-specific fields
  const [wheelDiameter, setWheelDiameter] = useState(initialWheelDiameter?.toString() ?? "");
  const [wheelWidth, setWheelWidth] = useState(initialWheelWidth?.toString() ?? "");
  const [boltPattern, setBoltPattern] = useState(initialBoltPattern);
  const [wheelOffset, setWheelOffset] = useState(initialWheelOffset?.toString() ?? "");
  const [centerBore, setCenterBore] = useState(initialCenterBore?.toString() ?? "");
  const [wheelQuantity, setWheelQuantity] = useState(initialWheelQuantity?.toString() ?? "");
  const [wheelBrand, setWheelBrand] = useState(initialWheelBrand);
  const [wheelMaterial, setWheelMaterial] = useState(initialWheelMaterial);
  const [wheelStyle, setWheelStyle] = useState(initialWheelStyle);

  // Image management
  const [existingImages, setExistingImages] = useState<string[]>(initialImageUrls);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const totalImageCount = existingImages.length + newFiles.length;
  const canAddMoreImages = totalImageCount < 5;

  async function handleDeleteImage(imageUrl: string) {
    setDeletingImage(imageUrl);

    // Extract the storage path from the URL
    // URLs look like: https://xxx.supabase.co/storage/v1/object/public/listings-images/ownerId/listingId/uuid.ext
    const urlParts = imageUrl.split("/listings-images/");
    if (urlParts.length !== 2) {
      toast({ type: "error", message: "Could not determine image path" });
      setDeletingImage(null);
      return;
    }
    const storagePath = urlParts[1];

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("listings-images")
      .remove([storagePath]);

    if (storageError) {
      console.error("Failed to delete from storage:", storageError);
      // Continue anyway - we'll still remove from the listing
    }

    // Update the listing to remove this URL
    const updatedUrls = existingImages.filter((url) => url !== imageUrl);
    const { error: updateError } = await supabase
      .from("listings")
      .update({ image_urls: updatedUrls })
      .eq("id", listingId);

    if (updateError) {
      toast({ type: "error", message: "Failed to update listing" });
      setDeletingImage(null);
      return;
    }

    setExistingImages(updatedUrls);
    toast({ type: "success", message: "Image deleted" });
    setDeletingImage(null);
  }

  async function uploadNewImages(): Promise<string[]> {
    if (newFiles.length === 0) return [];

    const urls: string[] = [];
    for (const file of newFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;

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

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      title: nextTitle || null,
      price_eur: nextPrice,
      location: location || null,
      description: nextDescription || null,
    };

    // Add car-specific fields if category is "car"
    if (category === "car") {
      const yearInt = year.trim() ? parseInt(year.trim(), 10) : null;
      const engineCcInt = engineCc.trim() ? parseInt(engineCc.trim(), 10) : null;
      const mileageInt = mileageKm.trim() ? parseInt(mileageKm.trim(), 10) : null;

      updatePayload.make = make.trim() || null;
      updatePayload.model = model.trim() || null;
      updatePayload.year = Number.isFinite(yearInt) ? yearInt : null;
      updatePayload.engine_cc = Number.isFinite(engineCcInt) ? engineCcInt : null;
      updatePayload.engine_type = engineType.trim() || null;
      updatePayload.transmission = transmission || null;
      updatePayload.mileage_km = Number.isFinite(mileageInt) ? mileageInt : null;
      updatePayload.vin = vin.trim() || null;
    }

    // Add wheel-specific fields if category is "wheels"
    if (category === "wheels") {
      const diameterNum = wheelDiameter ? parseFloat(wheelDiameter) : null;
      const widthNum = wheelWidth ? parseFloat(wheelWidth) : null;
      const offsetNum = wheelOffset.trim() ? parseInt(wheelOffset.trim(), 10) : null;
      const boreNum = centerBore.trim() ? parseFloat(centerBore.trim()) : null;
      const qtyNum = wheelQuantity ? parseInt(wheelQuantity, 10) : null;

      updatePayload.wheel_diameter = Number.isFinite(diameterNum) ? diameterNum : null;
      updatePayload.wheel_width = Number.isFinite(widthNum) ? widthNum : null;
      updatePayload.bolt_pattern = boltPattern || null;
      updatePayload.wheel_offset = Number.isFinite(offsetNum) ? offsetNum : null;
      updatePayload.center_bore = Number.isFinite(boreNum) ? boreNum : null;
      updatePayload.wheel_quantity = Number.isFinite(qtyNum) ? qtyNum : null;
      updatePayload.wheel_brand = wheelBrand || null;
      updatePayload.wheel_material = wheelMaterial || null;
      updatePayload.wheel_style = wheelStyle.trim() || null;
    }

    setLoading(true);

    // Upload new images if any
    let finalImageUrls = [...existingImages];
    if (newFiles.length > 0) {
      setUploadingImages(true);
      try {
        const uploadedUrls = await uploadNewImages();
        finalImageUrls = [...existingImages, ...uploadedUrls];
        updatePayload.image_urls = finalImageUrls;
      } catch (uploadErr) {
        const message =
          uploadErr && typeof uploadErr === "object" && "message" in uploadErr
            ? (uploadErr as { message?: string }).message ?? "Image upload failed."
            : "Image upload failed.";
        setError(message);
        toast({ type: "error", message });
        setLoading(false);
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update(updatePayload)
      .eq("id", listingId);

    if (updateError) {
      setError(updateError.message);
      toast({ type: "error", message: updateError.message });
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
      <label style={labelStyle}>Title</label>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />

      {category === "car" && (
        <>
          <div style={sectionHeader}>Vehicle Details</div>

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Make</label>
              <select
                className="select"
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setModel(""); // Reset model when make changes
                }}
                disabled={loading}
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
              <label style={labelStyle}>Model</label>
              <select
                className="select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading || !make}
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

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Year</label>
              <input
                className="input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 1989"
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Mileage (km)</label>
              <input
                className="input"
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 85000"
                disabled={loading}
              />
            </div>
          </div>

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Engine Size (cc)</label>
              <input
                className="input"
                value={engineCc}
                onChange={(e) => setEngineCc(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 3600"
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Engine Type</label>
              <input
                className="input"
                value={engineType}
                onChange={(e) => setEngineType(e.target.value)}
                placeholder="e.g. Flat-6"
                disabled={loading}
              />
            </div>
          </div>

          <label style={labelStyle}>Transmission</label>
          <select
            className="select"
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            disabled={loading}
          >
            <option value="">Select...</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
            <option value="Semi-Automatic">Semi-Automatic</option>
            <option value="CVT">CVT</option>
            <option value="Other">Other</option>
          </select>

          <label style={labelStyle}>VIN (optional)</label>
          <input
            className="input"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="17-character VIN"
            maxLength={17}
            disabled={loading}
          />
        </>
      )}

      {category === "wheels" && (
        <>
          <div style={sectionHeader}>Wheel Specifications</div>

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Brand</label>
              <select
                className="select"
                value={wheelBrand}
                onChange={(e) => setWheelBrand(e.target.value)}
                disabled={loading}
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
              <label style={labelStyle}>Style/Model</label>
              <input
                className="input"
                value={wheelStyle}
                onChange={(e) => setWheelStyle(e.target.value)}
                placeholder="e.g. TE37, RPF1, RS"
                disabled={loading}
              />
            </div>
          </div>

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Diameter (inches)</label>
              <select
                className="select"
                value={wheelDiameter}
                onChange={(e) => setWheelDiameter(e.target.value)}
                disabled={loading}
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
              <label style={labelStyle}>Width (inches)</label>
              <select
                className="select"
                value={wheelWidth}
                onChange={(e) => setWheelWidth(e.target.value)}
                disabled={loading}
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

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Bolt Pattern (PCD)</label>
              <select
                className="select"
                value={boltPattern}
                onChange={(e) => setBoltPattern(e.target.value)}
                disabled={loading}
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
              <label style={labelStyle}>Offset (ET)</label>
              <input
                className="input"
                value={wheelOffset}
                onChange={(e) => setWheelOffset(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 35, -10"
                disabled={loading}
              />
            </div>
          </div>

          <div style={twoCol}>
            <div>
              <label style={labelStyle}>Center Bore (mm)</label>
              <input
                className="input"
                value={centerBore}
                onChange={(e) => setCenterBore(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 67.1, 73.1"
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Quantity</label>
              <select
                className="select"
                value={wheelQuantity}
                onChange={(e) => setWheelQuantity(e.target.value)}
                disabled={loading}
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

          <label style={labelStyle}>Material</label>
          <select
            className="select"
            value={wheelMaterial}
            onChange={(e) => setWheelMaterial(e.target.value)}
            disabled={loading}
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

      <label style={labelStyle}>Price (EUR)</label>
      <input
        className="input"
        type="number"
        step="1"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={loading}
      />

      <label style={labelStyle}>Location</label>
      <select
        className="select"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        disabled={loading}
      >
        <option value="">Select county...</option>
        {IRISH_COUNTIES.map((county) => (
          <option key={county} value={county}>
            {county}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Description</label>
      <textarea
        className="textarea"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
      />

      {/* Image Management Section */}
      <div style={sectionHeader}>Photos</div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div style={imageGridStyle}>
          {existingImages.map((url, index) => (
            <div key={url} style={imageItemStyle}>
              <img
                src={url}
                alt={`Listing image ${index + 1}`}
                style={imageThumbnailStyle}
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(url)}
                disabled={loading || deletingImage === url}
                style={deleteButtonStyle}
                title="Delete image"
              >
                {deletingImage === url ? "…" : "×"}
              </button>
            </div>
          ))}
        </div>
      )}

      {existingImages.length === 0 && newFiles.length === 0 && (
        <div style={noImagesStyle}>No photos yet</div>
      )}

      {/* New Images Preview */}
      {newFiles.length > 0 && (
        <div style={{ marginTop: existingImages.length > 0 ? 12 : 0 }}>
          <div style={smallTextStyle}>{newFiles.length} new photo(s) to upload:</div>
          <div style={newFilesListStyle}>
            {newFiles.map((file, index) => (
              <div key={index} style={newFileItemStyle}>
                <span style={fileNameStyle}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
                  disabled={loading}
                  style={removeFileButtonStyle}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Images */}
      {canAddMoreImages && (
        <div style={{ marginTop: 8 }}>
          <label style={smallTextStyle}>
            Add photos ({5 - totalImageCount} remaining)
          </label>
          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            disabled={loading || uploadingImages}
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files ?? []);
              const availableSlots = 5 - totalImageCount;
              const filesToAdd = selectedFiles.slice(0, availableSlots);
              setNewFiles((prev) => [...prev, ...filesToAdd]);
              e.target.value = ""; // Reset input to allow selecting same file again
            }}
          />
        </div>
      )}

      {!canAddMoreImages && (
        <div style={smallTextStyle}>Maximum 5 photos reached</div>
      )}

      {uploadingImages && (
        <div style={smallTextStyle}>Uploading images...</div>
      )}

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

const labelStyle: CSSProperties = {
  fontWeight: 800,
  color: "var(--green-900)",
};

const sectionHeader: CSSProperties = {
  marginTop: 8,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)",
  fontWeight: 900,
  fontSize: 16,
  color: "var(--green-900)",
};

const twoCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const errorStyles: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.3)",
  background: "rgba(220,38,38,.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
};

// Image management styles
const imageGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
  gap: 12,
};

const imageItemStyle: CSSProperties = {
  position: "relative",
  aspectRatio: "1",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid var(--border)",
};

const imageThumbnailStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const deleteButtonStyle: CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: "none",
  background: "rgba(220,38,38,0.9)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  lineHeight: 1,
};

const noImagesStyle: CSSProperties = {
  padding: 24,
  borderRadius: 12,
  border: "1px dashed var(--border)",
  background: "var(--soft)",
  textAlign: "center",
  color: "var(--muted)",
  fontWeight: 650,
};

const smallTextStyle: CSSProperties = {
  color: "var(--muted)",
  fontWeight: 650,
  fontSize: 13,
};

const newFilesListStyle: CSSProperties = {
  marginTop: 8,
  display: "grid",
  gap: 6,
};

const newFileItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 8,
  background: "var(--soft)",
  border: "1px solid var(--border)",
};

const fileNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--green-900)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const removeFileButtonStyle: CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid rgba(220,38,38,0.3)",
  background: "rgba(220,38,38,0.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};
