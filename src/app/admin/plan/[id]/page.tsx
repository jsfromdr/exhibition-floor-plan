"use client";

import { useState } from "react";
import Link from "next/link";
import { useActivePlan } from "@/context/ActivePlanContext";
import ExhibitorsTable from "@/components/admin/ExhibitorsTable";
import FloorPlanEditor from "@/components/admin/FloorPlanEditor";
import HistoryPanel from "@/components/admin/HistoryPanel";
import DarkModeToggle from "@/components/DarkModeToggle";

type Tab = "exhibitors" | "floorplan" | "history";

export default function AdminPlanPage() {
  const { plan, undo, redo, canUndo, canRedo, historyEntries, restoreTo } = useActivePlan();
  const [tab, setTab] = useState<Tab>("exhibitors");

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition ${
      tab === t
        ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border border-b-0 border-gray-200 dark:border-gray-700"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr; All Plans</Link>
            <h1 className="text-lg font-bold tracking-tight">{plan.name}</h1>
            <Link href={`/plan/${plan.id}`} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
              View Public &rarr;
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Redo (Ctrl+Shift+Z)"
            >
              Redo
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 sm:px-6">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          <button className={tabCls("exhibitors")} onClick={() => setTab("exhibitors")}>Exhibitors</button>
          <button className={tabCls("floorplan")} onClick={() => setTab("floorplan")}>Floor Plan Editor</button>
          <button className={tabCls("history")} onClick={() => setTab("history")}>
            History {historyEntries.length > 0 && <span className="ml-1 text-xs text-gray-400">({historyEntries.length})</span>}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {tab === "exhibitors" && <ExhibitorsTable />}
        {tab === "floorplan" && <FloorPlanEditor />}
        {tab === "history" && (
          <HistoryPanel
            entries={historyEntries}
            onRestore={restoreTo}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        )}
      </div>
    </div>
  );
}
