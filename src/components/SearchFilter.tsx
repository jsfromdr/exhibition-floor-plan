"use client";

import { BoothStatus } from "@/data/types";

const ALL_STATUSES: BoothStatus[] = ["Available", "Sold", "Option", "Reserved"];

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  activeStatuses: BoothStatus[];
  onToggleStatus: (s: BoothStatus) => void;
}

const statusChipColor: Record<BoothStatus, string> = {
  Available: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  Sold:      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Option:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Reserved:  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function SearchFilter({ query, onQueryChange, activeStatuses, onToggleStatus }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search booth or company…"
          className="w-56 rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm
            placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Status filter chips */}
      {ALL_STATUSES.map((s) => {
        const active = activeStatuses.includes(s);
        return (
          <button
            key={s}
            onClick={() => onToggleStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition
              ${active ? statusChipColor[s] : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"}
              hover:opacity-80`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
