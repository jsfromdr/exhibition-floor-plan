"use client";

import { useCallback, useMemo, useState } from "react";
import { Booth, BoothStatus, STATUS_COLORS } from "@/data/types";
import { useActivePlan } from "@/context/ActivePlanContext";
import SearchFilter from "@/components/SearchFilter";
import BoothFormModal from "./BoothFormModal";

const ALL_STATUSES: BoothStatus[] = ["Available", "Sold", "Option", "Reserved"];

export default function ExhibitorsTable() {
  const { booths, addBooth, updateBooth, deleteBooth } = useActivePlan();
  const [editing, setEditing] = useState<Booth | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Search + filter state
  const [query, setQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<BoothStatus[]>([...ALL_STATUSES]);

  const toggleStatus = useCallback((s: BoothStatus) => {
    setActiveStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);

  const filteredBooths = useMemo(() => {
    const q = query.toLowerCase().trim();
    return booths.filter((b) => {
      const matchesStatus = activeStatuses.includes(b.status);
      const matchesQuery =
        !q ||
        b.boothNumber.toLowerCase().includes(q) ||
        (b.companyName?.toLowerCase().includes(q) ?? false) ||
        (b.category?.toLowerCase().includes(q) ?? false);
      return matchesStatus && matchesQuery;
    });
  }, [booths, query, activeStatuses]);

  const handleSave = (booth: Booth) => {
    if (editing) {
      updateBooth(booth.id, booth);
    } else {
      addBooth(booth);
    }
    setEditing(null);
    setCreating(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchFilter query={query} onQueryChange={setQuery} activeStatuses={activeStatuses} onToggleStatus={toggleStatus} />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing {filteredBooths.length} of {booths.length}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          + Add Booth
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Booth</th>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredBooths.map((b) => {
              const c = STATUS_COLORS[b.status];
              return (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{b.boothNumber}</td>
                  <td className="px-4 py-3">
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.companyName || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{b.category || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    ({b.position.x}, {b.position.y})
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {b.dimensions.width}×{b.dimensions.height}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setEditing(b)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                    >
                      Edit
                    </button>
                    {confirmDelete === b.id ? (
                      <>
                        <button
                          onClick={() => { deleteBooth(b.id); setConfirmDelete(null); }}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(b.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredBooths.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  {booths.length === 0 ? 'No booths yet. Click "+ Add Booth" to create one.' : "No booths match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <BoothFormModal
          booth={editing}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
