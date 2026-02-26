"use client";

import { useState } from "react";
import Link from "next/link";
import { useFloorPlanList } from "@/context/FloorPlanListContext";
import FloorPlanTable from "@/components/FloorPlanTable";
import CreatePlanModal from "@/components/admin/CreatePlanModal";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function AdminPage() {
  const { plans, loaded, error, createPlan, duplicatePlan, deletePlan, renamePlan } = useFloorPlanList();
  const [showCreate, setShowCreate] = useState(false);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-400">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-red-500 text-sm max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
            <Link href="/" className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              &larr; Public View
            </Link>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">{plans.length} floor plan{plans.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            + New Floor Plan
          </button>
        </div>

        <FloorPlanTable
          plans={plans}
          showActions
          basePath="/admin/plan"
          onDuplicate={duplicatePlan}
          onDelete={deletePlan}
          onRename={renamePlan}
        />
      </div>

      {showCreate && (
        <CreatePlanModal
          onSave={(name, w, h) => {
            createPlan(name, w, h);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
