"use client";

import { HistoryEntry } from "@/data/types";

interface Props {
  entries: HistoryEntry[];
  onRestore: (index: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function HistoryPanel({ entries, onRestore, canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Redo
        </button>
        <span className="text-xs text-gray-400">{entries.length} entr{entries.length === 1 ? "y" : "ies"} in history</span>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No history yet. Changes will appear here.</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {/* Show newest first */}
          {[...entries].reverse().map((entry, reverseIdx) => {
            const actualIdx = entries.length - 1 - reverseIdx;
            return (
              <div
                key={entry.timestamp + reverseIdx}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.label}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => onRestore(actualIdx)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Restore
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
