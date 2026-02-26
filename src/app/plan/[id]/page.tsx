"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Booth, BoothStatus } from "@/data/types";
import { useActivePlan } from "@/context/ActivePlanContext";
import FloorPlanCanvas from "@/components/FloorPlanCanvas";
import SearchFilter from "@/components/SearchFilter";
import Legend from "@/components/Legend";
import DarkModeToggle from "@/components/DarkModeToggle";

const ALL_STATUSES: BoothStatus[] = ["Available", "Sold", "Option", "Reserved"];

function exportCSV(booths: Booth[]) {
  const header = "Booth Number,Company,Status,Category,Position X,Position Y,Width,Height,Description";
  const rows = booths.map((b) =>
    [
      b.boothNumber,
      b.companyName ?? "",
      b.status,
      b.category ?? "",
      b.position.x,
      b.position.y,
      b.dimensions.width,
      b.dimensions.height,
      `"${(b.description ?? "").replace(/"/g, '""')}"`,
    ].join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "booths.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function PlanViewerPage() {
  const { plan, booths, bgImage, boundaryPolygon, canvasWidth, canvasHeight } = useActivePlan();
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [query, setQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<BoothStatus[]>([...ALL_STATUSES]);

  const toggleStatus = useCallback((s: BoothStatus) => {
    setActiveStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);

  const highlightedIds = useMemo(() => {
    const q = query.toLowerCase().trim();
    const ids = new Set<string>();
    booths.forEach((b) => {
      const matchesStatus = activeStatuses.includes(b.status);
      const matchesQuery = !q || b.boothNumber.toLowerCase().includes(q) || (b.companyName?.toLowerCase().includes(q) ?? false);
      if (matchesStatus && matchesQuery) ids.add(b.id);
    });
    if (ids.size === booths.length) return new Set<string>();
    return ids;
  }, [query, activeStatuses, booths]);

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr; All Plans</Link>
          <h1 className="text-lg font-bold tracking-tight">{plan.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchFilter query={query} onQueryChange={setQuery} activeStatuses={activeStatuses} onToggleStatus={toggleStatus} />
          <button
            onClick={() => exportCSV(booths)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Export CSV
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-2 sm:px-6">
        <Legend booths={booths} />
      </div>

      <FloorPlanCanvas
        booths={booths}
        selectedBooth={selectedBooth}
        highlightedIds={highlightedIds}
        onSelectBooth={setSelectedBooth}
        bgImage={bgImage}
        boundaryPolygon={boundaryPolygon}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    </div>
  );
}
