"use client";

import { useState, useEffect, useRef } from "react";
import { Booth, BoothStatus } from "@/data/types";

const STATUSES: BoothStatus[] = ["Available", "Sold", "Option", "Reserved"];

interface Props {
  booth: Booth | null;
  onSave: (booth: Booth) => void;
  onCancel: () => void;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Compress an image to max 200×200 JPEG to keep logos small. */
function compressLogo(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = dataUrl;
  });
}

export default function BoothFormModal({ booth, onSave, onCancel }: Props) {
  const isEdit = !!booth;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    boothNumber: "",
    companyName: "",
    status: "Available" as BoothStatus,
    x: 100,
    y: 100,
    width: 160,
    height: 120,
    category: "",
    description: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (booth) {
      setForm({
        boothNumber: booth.boothNumber,
        companyName: booth.companyName ?? "",
        status: booth.status,
        x: booth.position.x,
        y: booth.position.y,
        width: booth.dimensions.width,
        height: booth.dimensions.height,
        category: booth.category ?? "",
        description: booth.description ?? "",
        logoUrl: booth.logoUrl ?? "",
      });
    }
  }, [booth]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressLogo(reader.result as string);
      setForm((f) => ({ ...f, logoUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: booth?.id ?? genId(),
      boothNumber: form.boothNumber.trim(),
      companyName: form.companyName.trim() || undefined,
      status: form.status,
      position: { x: form.x, y: form.y },
      dimensions: { width: form.width, height: form.height },
      category: form.category.trim() || undefined,
      description: form.description.trim() || undefined,
      logoUrl: form.logoUrl || undefined,
    });
  };

  const field = "block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const label = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEdit ? "Edit Booth" : "Add Booth"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Booth Number *</label>
            <input required className={field} value={form.boothNumber} onChange={(e) => setForm((f) => ({ ...f, boothNumber: e.target.value }))} placeholder="e.g. A01" />
          </div>
          <div>
            <label className={label}>Status</label>
            <select className={field} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BoothStatus }))}>
              {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={label}>Company Name</label>
            <input className={field} value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} placeholder="Leave empty if booth is available" />
          </div>

          {/* Logo upload */}
          <div className="col-span-2">
            <label className={label}>Logo</label>
            <div className="flex items-center gap-3">
              {form.logoUrl && (
                <img src={form.logoUrl} alt="Logo" className="h-12 w-12 rounded object-contain border border-gray-200 dark:border-gray-700" />
              )}
              <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition">
                {form.logoUrl ? "Change" : "Upload"}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {form.logoUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))} className="text-xs text-red-500 hover:text-red-700">
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">Max 2MB, image files only. Compressed to 200×200.</p>
          </div>

          <div>
            <label className={label}>Position X</label>
            <input type="number" className={field} value={form.x} min={0} onChange={(e) => setForm((f) => ({ ...f, x: +e.target.value }))} />
          </div>
          <div>
            <label className={label}>Position Y</label>
            <input type="number" className={field} value={form.y} min={0} onChange={(e) => setForm((f) => ({ ...f, y: +e.target.value }))} />
          </div>
          <div>
            <label className={label}>Width</label>
            <input type="number" className={field} value={form.width} min={40} onChange={(e) => setForm((f) => ({ ...f, width: +e.target.value }))} />
          </div>
          <div>
            <label className={label}>Height</label>
            <input type="number" className={field} value={form.height} min={40} onChange={(e) => setForm((f) => ({ ...f, height: +e.target.value }))} />
          </div>
          <div>
            <label className={label}>Category</label>
            <input className={field} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Technology" />
          </div>
          <div className="col-span-2">
            <label className={label}>Description</label>
            <textarea className={field + " resize-none"} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
            {isEdit ? "Save Changes" : "Add Booth"}
          </button>
        </div>
      </form>
    </div>
  );
}
