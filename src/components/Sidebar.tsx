"use client";

import { Booth, STATUS_COLORS } from "@/data/types";

interface Props {
  booth: Booth | null;
  onClose: () => void;
}

export default function Sidebar({ booth, onClose }: Props) {
  if (!booth) return null;

  const colors = STATUS_COLORS[booth.status];

  return (
    <div className="absolute top-0 right-0 z-30 h-full w-80 border-l border-gray-200 bg-white shadow-xl
      dark:border-gray-700 dark:bg-gray-900 transition-transform duration-300 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Booth Details</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{booth.boothNumber}</span>
          <span
            className="rounded-full px-3 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {booth.status}
          </span>
        </div>

        {/* Logo */}
        {booth.logoUrl && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Logo</label>
            <img
              src={booth.logoUrl}
              alt={`${booth.companyName ?? booth.boothNumber} logo`}
              className="mt-2 max-h-24 max-w-full rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
            />
          </div>
        )}

        {booth.companyName && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Company</label>
            <p className="mt-1 text-base font-medium text-gray-800 dark:text-gray-200">{booth.companyName}</p>
          </div>
        )}

        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Dimensions</label>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {booth.dimensions.width} × {booth.dimensions.height} px
          </p>
        </div>

        {booth.category && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Category</label>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{booth.category}</p>
          </div>
        )}

        {booth.description && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</label>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{booth.description}</p>
          </div>
        )}

        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><span className="font-medium">Position:</span> ({booth.position.x}, {booth.position.y})</p>
          <p><span className="font-medium">ID:</span> {booth.id}</p>
        </div>
      </div>
    </div>
  );
}
