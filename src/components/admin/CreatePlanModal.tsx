"use client";

import { useState } from "react";

interface Props {
  onSave: (name: string, width: number, height: number) => void;
  onCancel: () => void;
}

export default function CreatePlanModal({ onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [width, setWidth] = useState(1060);
  const [height, setHeight] = useState(700);

  const field = "block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const label = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name.trim(), width, height);
        }}
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Floor Plan</h2>

        <div>
          <label className={label}>Name *</label>
          <input required autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hall A - 2025" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Canvas Width (px)</label>
            <input type="number" className={field} value={width} min={400} max={4000} onChange={(e) => setWidth(+e.target.value)} />
          </div>
          <div>
            <label className={label}>Canvas Height (px)</label>
            <input type="number" className={field} value={height} min={300} max={3000} onChange={(e) => setHeight(+e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
