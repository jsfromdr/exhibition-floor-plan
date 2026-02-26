"use client";

import { useCallback, useRef, useState } from "react";
import { FloorPlanSnapshot, HistoryEntry } from "@/data/types";

const MAX_HISTORY = 200;

export function useHistory(initialSnapshot: FloorPlanSnapshot) {
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [present, setPresent] = useState<FloorPlanSnapshot>(initialSnapshot);
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  // Pre-drag snapshot for batch operations
  const preDragSnapshot = useRef<FloorPlanSnapshot | null>(null);

  /** Push a new snapshot to history. */
  const pushState = useCallback((next: FloorPlanSnapshot, label: string) => {
    setPast((p) => {
      const entry: HistoryEntry = { timestamp: Date.now(), label, snapshot: present };
      const newPast = [...p, entry];
      return newPast.length > MAX_HISTORY ? newPast.slice(-MAX_HISTORY) : newPast;
    });
    setPresent(next);
    setFuture([]);
  }, [present]);

  /** Update present without pushing to history (used during drags). */
  const updatePresent = useCallback((next: FloorPlanSnapshot) => {
    setPresent(next);
  }, []);

  /** Begin a batch operation. Saves current state so endBatch creates one entry. */
  const beginBatch = useCallback((label: string) => {
    preDragSnapshot.current = present;
  }, [present]);

  /** End a batch operation. Pushes the pre-batch state to past. */
  const endBatch = useCallback((label: string) => {
    if (preDragSnapshot.current) {
      setPast((p) => {
        const entry: HistoryEntry = { timestamp: Date.now(), label, snapshot: preDragSnapshot.current! };
        const newPast = [...p, entry];
        return newPast.length > MAX_HISTORY ? newPast.slice(-MAX_HISTORY) : newPast;
      });
      setFuture([]);
      preDragSnapshot.current = null;
    }
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const last = p[p.length - 1];
      setPresent((cur) => {
        setFuture((f) => [{ timestamp: Date.now(), label: "Redo", snapshot: cur }, ...f]);
        return last.snapshot;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const first = f[0];
      setPresent((cur) => {
        setPast((p) => [...p, { timestamp: Date.now(), label: "Undo", snapshot: cur }]);
        return first.snapshot;
      });
      return f.slice(1);
    });
  }, []);

  const restoreTo = useCallback((index: number) => {
    setPast((p) => {
      if (index < 0 || index >= p.length) return p;
      const target = p[index];
      setPresent((cur) => {
        const afterTarget = p.slice(index + 1);
        setFuture([
          ...afterTarget,
          { timestamp: Date.now(), label: "Before restore", snapshot: cur },
        ]);
        return target.snapshot;
      });
      return p.slice(0, index);
    });
  }, []);

  /** Reset history with a new initial state (e.g. when switching plans). */
  const reset = useCallback((snapshot: FloorPlanSnapshot) => {
    setPast([]);
    setPresent(snapshot);
    setFuture([]);
    preDragSnapshot.current = null;
  }, []);

  return {
    present,
    past,
    future,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pushState,
    updatePresent,
    beginBatch,
    endBatch,
    undo,
    redo,
    restoreTo,
    reset,
  };
}
