"use client";

import Link from "next/link";
import { useFloorPlanList } from "@/context/FloorPlanListContext";
import FloorPlanTable from "@/components/FloorPlanTable";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function Home() {
  const { plans, loaded, error } = useFloorPlanList();

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950 text-gray-400">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-red-500 text-sm max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">Exhibition Floor Plans</h1>
          <Link href="/admin" className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Admin Panel &rarr;
          </Link>
        </div>
        <DarkModeToggle />
      </header>

      <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
        <FloorPlanTable plans={plans} basePath="/plan" />
      </div>
    </div>
  );
}
