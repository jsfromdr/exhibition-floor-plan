"use client";

import { useState } from "react";
import Link from "next/link";
import { FloorPlanMeta } from "@/data/types";

interface Props {
  plans: FloorPlanMeta[];
  showActions?: boolean;
  basePath: string;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
}

export default function FloorPlanTable({ plans, showActions, basePath, onDuplicate, onDelete, onRename }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (plan: FloorPlanMeta) => {
    setRenaming(plan.id);
    setRenameValue(plan.name);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim() && onRename) onRename(id, renameValue.trim());
    setRenaming(null);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Last Modified</th>
            <th className="px-4 py-3">Booths</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {plans.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {renaming === p.id ? (
                  <input
                    autoFocus
                    className="rounded border border-blue-400 px-2 py-0.5 text-sm dark:bg-gray-800"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(p.id);
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    onBlur={() => commitRename(p.id)}
                  />
                ) : (
                  p.name
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                {new Date(p.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.boothCount}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <Link
                  href={`${basePath}/${p.id}`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {showActions ? "Edit" : "View"}
                </Link>
                {showActions && (
                  <>
                    <button
                      onClick={() => startRename(p)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => onDuplicate?.(p.id)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      Duplicate
                    </button>
                    {confirmDelete === p.id ? (
                      <>
                        <button
                          onClick={() => { onDelete?.(p.id); setConfirmDelete(null); }}
                          className="text-xs font-medium text-red-600"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs font-medium text-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
          {plans.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                No floor plans yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
