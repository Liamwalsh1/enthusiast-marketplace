"use client";

import { useRef, useState, useEffect } from "react";

type SlotConfig = {
  key: string;
  label: string;
  illustration: string;
};

const SLOTS: SlotConfig[] = [
  { key: "front-quarter", label: "Front 3/4",  illustration: "/front-quarter.png" },
  { key: "side-left",     label: "Left Side",  illustration: "/side-left.png" },
  { key: "front",         label: "Front",      illustration: "/front.png" },
  { key: "side-right",    label: "Right Side", illustration: "/side-right.png" },
  { key: "rear-quarter",  label: "Rear 3/4",   illustration: "/rear-quarter.png" },
  { key: "rear",          label: "Rear",        illustration: "/rear.png" },
];

type Props = {
  onChange: (files: File[]) => void;
};

export default function CarPhotoSlots({ onChange }: Props) {
  const [slotFiles, setSlotFiles] = useState<(File | null)[]>(new Array(SLOTS.length).fill(null));
  const [previews, setPreviews]   = useState<(string | null)[]>(new Array(SLOTS.length).fill(null));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSlotClick(index: number) {
    setActiveSlot(index);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    if (previews[activeSlot]) URL.revokeObjectURL(previews[activeSlot]!);

    const newFiles    = [...slotFiles];
    const newPreviews = [...previews];
    newFiles[activeSlot]    = file;
    newPreviews[activeSlot] = URL.createObjectURL(file);

    setSlotFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles.filter(Boolean) as File[]);
    e.target.value = "";
    setActiveSlot(null);
  }

  function removeSlot(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (previews[index]) URL.revokeObjectURL(previews[index]!);
    const newFiles    = [...slotFiles];
    const newPreviews = [...previews];
    newFiles[index]    = null;
    newPreviews[index] = null;
    setSlotFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles.filter(Boolean) as File[]);
  }

  useEffect(() => {
    return () => { previews.forEach(url => { if (url) URL.revokeObjectURL(url); }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filledCount = slotFiles.filter(Boolean).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
          {filledCount}/{SLOTS.length} angles added
        </div>
        <div style={{ fontSize: 12, fontWeight: 650, color: "var(--muted)" }}>
          Tap an angle to upload
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
      }}>
        {SLOTS.map((slot, i) => (
          <button
            key={slot.key}
            type="button"
            onClick={() => handleSlotClick(i)}
            style={{
              position: "relative",
              border: `1.5px ${previews[i] ? "solid" : "dashed"} ${previews[i] ? "var(--green-700)" : "var(--border)"}`,
              borderRadius: 10,
              background: previews[i] ? "transparent" : "var(--soft)",
              cursor: "pointer",
              padding: 0,
              overflow: "hidden",
              aspectRatio: "4 / 3",
            }}
          >
            {previews[i] ? (
              <>
                <img
                  src={previews[i]!}
                  alt={slot.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <button
                  type="button"
                  onClick={(e) => removeSlot(i, e)}
                  style={{
                    position: "absolute", top: 4, right: 4,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "none",
                    color: "white", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slot.illustration}
                  alt={slot.label}
                  style={{
                    position: "absolute",
                    top: "8%", left: "6%",
                    width: "88%", height: "72%",
                    objectFit: "contain",
                    opacity: 0.45,
                    mixBlendMode: "multiply",
                  }}
                />
                <div style={{
                  position: "absolute", top: 5, right: 5,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--green-900)",
                  color: "white", fontSize: 15, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}>
                  +
                </div>
              </>
            )}

            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: previews[i] ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.85)",
              borderTop: previews[i] ? "none" : "1px solid var(--border)",
              padding: "3px 0",
              fontSize: 11, fontWeight: 700,
              color: previews[i] ? "white" : "var(--green-900)",
              textAlign: "center",
              letterSpacing: 0.3,
            }}>
              {slot.label}
            </div>
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
