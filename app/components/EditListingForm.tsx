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
  initialCondition: string;
  initialDescription: string;
  initialPhoneNumber: string;
  initialShowPhone: boolean;
  initialMake: string;
  initialModel: string;
  initialYear: number | null;
  initialTransmission: string;
  initialMileageKm: number | null;
  initialVin: string;
  initialGeneration: string;
  initialIsModified: boolean | null;
  initialModifications: string[];
  initialImageUrls: string[];
  initialVideoUrl: string | null;
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
  // Car history props
  initialPreviousOwners: number | null;
  initialStory: string;
  initialKnownIssues: string;
};

export default function EditListingForm({
  listingId,
  ownerId,
  category,
  initialTitle,
  initialPrice,
  initialLocation,
  initialCondition,
  initialDescription,
  initialPhoneNumber,
  initialShowPhone,
  initialMake,
  initialModel,
  initialYear,
  initialTransmission,
  initialMileageKm,
  initialVin,
  initialGeneration,
  initialIsModified,
  initialModifications,
  initialImageUrls,
  initialVideoUrl,
  initialWheelDiameter,
  initialWheelWidth,
  initialBoltPattern,
  initialWheelOffset,
  initialCenterBore,
  initialWheelQuantity,
  initialWheelBrand,
  initialWheelMaterial,
  initialWheelStyle,
  initialPreviousOwners,
  initialStory,
  initialKnownIssues,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [price, setPrice] = useState(initialPrice?.toString() ?? "");
  const [location, setLocation] = useState(initialLocation);
  const [condition, setCondition] = useState(initialCondition);
  const [description, setDescription] = useState(initialDescription);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [showPhone, setShowPhone] = useState(initialShowPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Car-specific fields
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState(initialYear?.toString() ?? "");
  const [transmission, setTransmission] = useState(initialTransmission);
  const [mileageKm, setMileageKm] = useState(initialMileageKm?.toString() ?? "");
  const [vin, setVin] = useState(initialVin);
  const [generation, setGeneration] = useState(initialGeneration);
  const [isModified, setIsModified] = useState<boolean | null>(initialIsModified);
  const [modifications, setModifications] = useState<string[]>(
    initialModifications.length > 0 ? initialModifications : [""]
  );

  // Car history fields
  const [previousOwners, setPreviousOwners] = useState(initialPreviousOwners?.toString() ?? "");
  const [story, setStory] = useState(initialStory);
  const [knownIssues, setKnownIssues] = useState(initialKnownIssues);

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
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Video management
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(initialVideoUrl);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

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

  async function handleDeleteVideo() {
    if (!existingVideoUrl) return;
    setDeletingVideo(true);

    const urlParts = existingVideoUrl.split("/listings-images/");
    if (urlParts.length === 2) {
      const storagePath = urlParts[1];
      await supabase.storage.from("listings-images").remove([storagePath]);
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({ video_url: null })
      .eq("id", listingId);

    if (updateError) {
      toast({ type: "error", message: "Failed to remove video" });
      setDeletingVideo(false);
      return;
    }

    setExistingVideoUrl(null);
    toast({ type: "success", message: "Video removed" });
    setDeletingVideo(false);
  }

  // Drag and drop handlers for image reordering
  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...existingImages];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    setExistingImages(newOrder);
    setDraggedIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  async function handleSaveImageOrder() {
    setSavingOrder(true);
    const { error } = await supabase
      .from("listings")
      .update({ image_urls: existingImages })
      .eq("id", listingId);

    if (error) {
      toast({ type: "error", message: "Failed to save image order" });
    } else {
      toast({ type: "success", message: "Image order saved" });
    }
    setSavingOrder(false);
  }

  // Generate previews for new files
  function handleNewFilesChange(selectedFiles: File[]) {
    const availableSlots = 5 - totalImageCount;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    // Create preview URLs for new files
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setNewFilePreviews((prev) => [...prev, ...newPreviews]);
    setNewFiles((prev) => [...prev, ...filesToAdd]);
  }

  function handleRemoveNewFile(index: number) {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(newFilePreviews[index]);
    setNewFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadNewVideo(): Promise<string | null> {
    if (!newVideoFile) return null;

    const ext = newVideoFile.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("listings-images")
      .upload(path, newVideoFile, { contentType: newVideoFile.type });

    if (error) {
      console.error("Video upload failed:", error);
      throw error;
    }

    const { data } = supabase.storage.from("listings-images").getPublicUrl(path);
    return data.publicUrl;
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
      phone_number: phoneNumber.trim() || null,
      show_phone: phoneNumber.trim() ? showPhone : false,
    };

    if (category !== "car") {
      updatePayload.condition = condition.trim() || null;
    }

    // Add car-specific fields if category is "car"
    if (category === "car") {
      const yearInt = year.trim() ? parseInt(year.trim(), 10) : null;
      const mileageInt = mileageKm.trim() ? parseInt(mileageKm.trim(), 10) : null;

      updatePayload.make = make.trim() || null;
      updatePayload.model = model.trim() || null;
      updatePayload.year = Number.isFinite(yearInt) ? yearInt : null;
      updatePayload.transmission = transmission || null;
      updatePayload.mileage_km = Number.isFinite(mileageInt) ? mileageInt : null;
      updatePayload.generation = generation.trim() || null;
      updatePayload.vin = vin.trim() || null;
      updatePayload.is_modified = isModified ?? false;
      const filteredMods = modifications.filter((m) => m.trim() !== "");
      updatePayload.modifications = filteredMods.length > 0 ? filteredMods : null;
      updatePayload.previous_owners = previousOwners.trim() ? parseInt(previousOwners.trim(), 10) : null;
      updatePayload.story = story.trim() || null;
      updatePayload.known_issues = knownIssues.trim() || null;
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

    // Upload new video if any
    if (newVideoFile) {
      try {
        const videoUrl = await uploadNewVideo();
        if (videoUrl) {
          updatePayload.video_url = videoUrl;
        }
      } catch (uploadErr) {
        const message =
          uploadErr && typeof uploadErr === "object" && "message" in uploadErr
            ? (uploadErr as { message?: string }).message ?? "Video upload failed."
            : "Video upload failed.";
        setError(message);
        toast({ type: "error", message });
        setLoading(false);
        return;
      }
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

          <div className="form-two-col">
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

          <label style={labelStyle}>Generation (optional)</label>
          <input
            className="input"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
            placeholder="e.g. E60, F10, Mk4, NA, FD"
            disabled={loading}
          />

          <div className="form-two-col">
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
          </select>

          <label style={labelStyle}>Any modifications made?</label>
          <div style={radioGroup}>
            <button
              type="button"
              onClick={() => {
                setIsModified(false);
                setModifications([""]);
              }}
              disabled={loading}
              style={{
                ...radioOption,
                ...(isModified === false ? radioOptionSelected : {}),
              }}
            >
              No, it's stock
            </button>
            <button
              type="button"
              onClick={() => setIsModified(true)}
              disabled={loading}
              style={{
                ...radioOption,
                ...(isModified === true ? radioOptionSelected : {}),
              }}
            >
              Yes
            </button>
          </div>

          {isModified && (
            <div style={modificationsSection}>
              <label style={labelStyle}>List modifications</label>
              {modifications.map((mod, index) => (
                <div key={index} style={modificationRow}>
                  <span style={bulletStyle}>•</span>
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
                    disabled={loading}
                  />
                  {modifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newMods = modifications.filter((_, i) => i !== index);
                        setModifications(newMods);
                      }}
                      disabled={loading}
                      style={removeModBtn}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setModifications([...modifications, ""])}
                disabled={loading}
                style={addModBtn}
              >
                + Add another
              </button>
            </div>
          )}

          <label style={labelStyle}>VIN (optional)</label>
          <input
            className="input"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="17-character VIN"
            maxLength={17}
            disabled={loading}
          />

          <div style={sectionHeader}>Car History</div>

          <label style={labelStyle}>Previous Owners (optional)</label>
          <input
            className="input"
            type="number"
            min={0}
            max={99}
            value={previousOwners}
            onChange={(e) => setPreviousOwners(e.target.value)}
            placeholder="e.g. 2"
            disabled={loading}
          />

          <label style={labelStyle}>The Story (optional)</label>
          <textarea
            className="textarea"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Tell buyers about the car's history — where it's been, what it's done, why you're selling..."
            rows={4}
            disabled={loading}
          />

          <label style={labelStyle}>Known Issues (optional)</label>
          <textarea
            className="textarea"
            value={knownIssues}
            onChange={(e) => setKnownIssues(e.target.value)}
            placeholder="Be honest — list any faults, wear, or things that need attention..."
            rows={3}
            disabled={loading}
          />
        </>
      )}

      {category === "wheels" && (
        <>
          <div style={sectionHeader}>Wheel Specifications</div>

          <div className="form-two-col">
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

          <div className="form-two-col">
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

          <div className="form-two-col">
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

          <div className="form-two-col">
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

      {category !== "car" && (
        <>
          <label style={labelStyle}>Condition</label>
          <select className="select" value={condition} onChange={(e) => setCondition(e.target.value)} disabled={loading}>
            <option>New</option>
            <option>Used</option>
            <option>Refurbished</option>
          </select>
        </>
      )}

      <label style={labelStyle}>
        Phone Number <span style={{ fontWeight: 600, opacity: 0.6 }}>(optional)</span>
      </label>
      <input
        className="input"
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="e.g. 085 123 4567"
        disabled={loading}
      />
      {phoneNumber.trim() && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, cursor: "pointer", fontSize: 14, fontWeight: 650, color: "var(--text)" }}>
          <input
            type="checkbox"
            checked={showPhone}
            onChange={(e) => setShowPhone(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          Show my phone number on the listing
        </label>
      )}

      {/* Image Management Section */}
      <div style={sectionHeader}>Photos</div>

      {/* Existing Images with Drag & Drop Reordering */}
      {existingImages.length > 0 && (
        <>
          <div style={dragHintStyle}>Drag images to reorder. First image is the cover photo.</div>
          <div style={imageGridStyle}>
            {existingImages.map((url, index) => (
              <div
                key={url}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                style={{
                  ...imageItemStyle,
                  ...(draggedIndex === index ? draggedImageStyle : {}),
                  cursor: "grab",
                }}
              >
                {index === 0 && <div style={coverBadgeStyle}>Cover</div>}
                <div style={dragHandleStyle}>⋮⋮</div>
                <img
                  src={url}
                  alt={`Listing image ${index + 1}`}
                  style={imageThumbnailStyle}
                  draggable={false}
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
          {existingImages.length > 1 && (
            <button
              type="button"
              onClick={handleSaveImageOrder}
              disabled={loading || savingOrder}
              style={saveOrderButtonStyle}
            >
              {savingOrder ? "Saving..." : "Save image order"}
            </button>
          )}
        </>
      )}

      {existingImages.length === 0 && newFiles.length === 0 && (
        <div style={noImagesStyle}>No photos yet</div>
      )}

      {/* New Images Preview with Thumbnails */}
      {newFiles.length > 0 && (
        <div style={{ marginTop: existingImages.length > 0 ? 12 : 0 }}>
          <div style={smallTextStyle}>{newFiles.length} new photo(s) to upload:</div>
          <div style={imageGridStyle}>
            {newFiles.map((_, index) => (
              <div key={index} style={{ ...imageItemStyle, ...newImageItemStyle }}>
                <div style={newBadgeStyle}>New</div>
                <img
                  src={newFilePreviews[index] || ""}
                  alt={`New image ${index + 1}`}
                  style={imageThumbnailStyle}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNewFile(index)}
                  disabled={loading}
                  style={deleteButtonStyle}
                  title="Remove"
                >
                  ×
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
              handleNewFilesChange(selectedFiles);
              e.target.value = "";
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

      {/* Video Management Section */}
      <div style={sectionHeader}>Video</div>

      {existingVideoUrl && (
        <div style={videoPreviewStyle}>
          <video
            src={existingVideoUrl}
            controls
            preload="metadata"
            style={{ width: "100%", maxHeight: 200, borderRadius: 12 }}
          />
          <button
            type="button"
            onClick={handleDeleteVideo}
            disabled={loading || deletingVideo}
            style={removeVideoButtonStyle}
          >
            {deletingVideo ? "Removing..." : "Remove video"}
          </button>
        </div>
      )}

      {!existingVideoUrl && !newVideoFile && (
        <div style={noImagesStyle}>No video yet</div>
      )}

      {newVideoFile && (
        <div style={newFileItemStyle}>
          <span style={fileNameStyle}>
            {newVideoFile.name} ({(newVideoFile.size / (1024 * 1024)).toFixed(1)}MB)
          </span>
          <button
            type="button"
            onClick={() => setNewVideoFile(null)}
            disabled={loading}
            style={removeFileButtonStyle}
          >
            Remove
          </button>
        </div>
      )}

      {!existingVideoUrl && !newVideoFile && (
        <div style={{ marginTop: 8 }}>
          <label style={smallTextStyle}>Add video (max 100MB)</label>
          <input
            className="input"
            type="file"
            accept="video/*"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && file.size > 100 * 1024 * 1024) {
                setError("Video must be under 100MB");
                toast({ type: "error", message: "Video must be under 100MB" });
                e.target.value = "";
                return;
              }
              setNewVideoFile(file);
              e.target.value = "";
            }}
          />
        </div>
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

const videoPreviewStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const removeVideoButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid rgba(220,38,38,0.3)",
  background: "rgba(220,38,38,0.08)",
  color: "rgba(153,27,27,1)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  justifySelf: "start",
};

// Drag and drop styles
const dragHintStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  fontWeight: 600,
  marginBottom: 8,
};

const draggedImageStyle: CSSProperties = {
  opacity: 0.5,
  border: "2px dashed var(--green-900)",
};

const coverBadgeStyle: CSSProperties = {
  position: "absolute",
  top: 4,
  left: 4,
  padding: "2px 6px",
  borderRadius: 4,
  background: "var(--green-900)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  zIndex: 1,
};

const dragHandleStyle: CSSProperties = {
  position: "absolute",
  bottom: 4,
  left: "50%",
  transform: "translateX(-50%)",
  padding: "2px 8px",
  borderRadius: 4,
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  zIndex: 1,
  letterSpacing: -2,
};

const saveOrderButtonStyle: CSSProperties = {
  marginTop: 8,
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid var(--green-900)",
  background: "transparent",
  color: "var(--green-900)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const newImageItemStyle: CSSProperties = {
  border: "2px solid rgba(34, 197, 94, 0.5)",
};

const newBadgeStyle: CSSProperties = {
  position: "absolute",
  top: 4,
  left: 4,
  padding: "2px 6px",
  borderRadius: 4,
  background: "rgba(34, 197, 94, 0.9)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  zIndex: 1,
};

// Modifications styles
const radioGroup: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 8,
};

const radioOption: CSSProperties = {
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
};

const radioOptionSelected: CSSProperties = {
  background: "var(--green-900)",
  borderColor: "var(--green-900)",
  color: "white",
};

const modificationsSection: CSSProperties = {
  marginTop: 8,
  padding: 12,
  background: "var(--soft)",
  borderRadius: 10,
};

const modificationRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
};

const bulletStyle: CSSProperties = {
  color: "var(--green-900)",
  fontWeight: 900,
  fontSize: 18,
};

const removeModBtn: CSSProperties = {
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
};

const addModBtn: CSSProperties = {
  marginTop: 10,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px dashed var(--border)",
  background: "transparent",
  fontWeight: 650,
  fontSize: 13,
  color: "var(--green-900)",
  cursor: "pointer",
};
