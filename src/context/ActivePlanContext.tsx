"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Booth, BoothSnapshot, FloorPlan, FloorPlanSnapshot, HistoryEntry, Point } from "@/data/types";
import { useHistory } from "@/hooks/useHistory";
import { useUndoRedoKeys } from "@/hooks/useUndoRedoKeys";
import { useFloorPlanList } from "./FloorPlanListContext";

interface ActivePlanContextValue {
  plan: FloorPlan;
  booths: Booth[];
  bgImage: string | null;
  boundaryPolygon: Point[];
  canvasWidth: number;
  canvasHeight: number;

  addBooth: (booth: Booth) => void;
  updateBooth: (id: string, updates: Partial<Booth>) => void;
  deleteBooth: (id: string) => void;
  setBooths: (booths: Booth[]) => void;
  setBgImage: (img: string | null) => void;
  setBoundaryPolygon: (polygon: Point[]) => void;

  // Drag batching
  beginDrag: (label: string) => void;
  updateDrag: (boothId: string, updates: Partial<Booth>) => void;
  endDrag: (label: string) => void;

  // Polygon drag batching
  beginPolygonDrag: () => void;
  updatePolygonDrag: (polygon: Point[]) => void;
  endPolygonDrag: () => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyEntries: HistoryEntry[];
  restoreTo: (index: number) => void;
}

const Ctx = createContext<ActivePlanContextValue | null>(null);

const EMPTY_SNAPSHOT: FloorPlanSnapshot = { booths: [], boundaryPolygon: [], bgImage: null };

/** Strip logoUrl from booths to create a snapshot (logos excluded from history). */
function toSnapshot(plan: { booths: Booth[]; boundaryPolygon: Point[]; bgImage?: string | null }): FloorPlanSnapshot {
  return {
    booths: plan.booths.map(({ logoUrl, ...rest }) => rest),
    boundaryPolygon: plan.boundaryPolygon,
    bgImage: plan.bgImage ?? null,
  };
}

/** Merge logos back into booth snapshots from the full booth list. */
function mergeLogos(snapshotBooths: BoothSnapshot[], fullBooths: Booth[]): Booth[] {
  const logoMap = new Map<string, string>();
  fullBooths.forEach((b) => {
    if (b.logoUrl) logoMap.set(b.id, b.logoUrl);
  });
  return snapshotBooths.map((sb) => ({
    ...sb,
    logoUrl: logoMap.get(sb.id),
  }));
}

interface Props {
  planId: string;
  children: ReactNode;
}

export function ActivePlanProvider({ planId, children }: Props) {
  const { loadPlan, savePlan } = useFloorPlanList();
  const [plan, setPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const logosRef = useRef<Booth[]>([]);
  const history = useHistory(EMPTY_SNAPSHOT);
  useUndoRedoKeys(history.undo, history.redo);

  // Auto-save debounce ref
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load plan async on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadPlan(planId).then((loaded) => {
      if (cancelled) return;
      if (loaded) {
        setPlan(loaded);
        logosRef.current = loaded.booths;
        history.reset(toSnapshot(loaded));
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current state derived from history present + logos
  const currentBooths = mergeLogos(history.present.booths, logosRef.current);
  const currentBgImage = history.present.bgImage ?? null;
  const currentPolygon = history.present.boundaryPolygon;

  // Persist to Supabase whenever present changes (fire-and-forget via savePlan)
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!plan) return;
    // Skip the save triggered by initial load
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    const updated: FloorPlan = {
      ...plan,
      booths: currentBooths,
      boundaryPolygon: currentPolygon,
      bgImage: currentBgImage,
    };
    // Update logos ref
    logosRef.current = currentBooths;
    savePlan(updated);
  }, [history.present]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Booth mutations ─────────────────────────────── */

  const addBooth = useCallback((booth: Booth) => {
    const { logoUrl, ...snap } = booth;
    if (logoUrl) logosRef.current = [...logosRef.current, booth];
    const next: FloorPlanSnapshot = {
      ...history.present,
      booths: [...history.present.booths, snap],
    };
    history.pushState(next, `Added booth ${booth.boothNumber}`);
  }, [history]);

  const updateBooth = useCallback((id: string, updates: Partial<Booth>) => {
    // Handle logo separately
    if (updates.logoUrl !== undefined) {
      logosRef.current = logosRef.current.map((b) =>
        b.id === id ? { ...b, logoUrl: updates.logoUrl } : b,
      );
      // If no booth in logos yet, add it
      if (!logosRef.current.find((b) => b.id === id)) {
        const existing = history.present.booths.find((b) => b.id === id);
        if (existing) logosRef.current.push({ ...existing, logoUrl: updates.logoUrl });
      }
    }
    const { logoUrl, ...snapUpdates } = updates;
    const next: FloorPlanSnapshot = {
      ...history.present,
      booths: history.present.booths.map((b) => (b.id === id ? { ...b, ...snapUpdates } : b)),
    };
    history.pushState(next, `Updated booth`);
  }, [history]);

  const deleteBooth = useCallback((id: string) => {
    logosRef.current = logosRef.current.filter((b) => b.id !== id);
    const next: FloorPlanSnapshot = {
      ...history.present,
      booths: history.present.booths.filter((b) => b.id !== id),
    };
    history.pushState(next, `Deleted booth`);
  }, [history]);

  const setBooths = useCallback((booths: Booth[]) => {
    logosRef.current = booths;
    const next: FloorPlanSnapshot = {
      ...history.present,
      booths: booths.map(({ logoUrl, ...rest }) => rest),
    };
    history.pushState(next, "Set booths");
  }, [history]);

  const setBgImage = useCallback((img: string | null) => {
    const next: FloorPlanSnapshot = { ...history.present, bgImage: img };
    history.pushState(next, img ? "Uploaded background" : "Removed background");
  }, [history]);

  const setBoundaryPolygon = useCallback((polygon: Point[]) => {
    const next: FloorPlanSnapshot = { ...history.present, boundaryPolygon: polygon };
    history.pushState(next, "Updated boundary");
  }, [history]);

  /* ── Drag batching ──────────────────────────────── */

  const beginDrag = useCallback((label: string) => {
    history.beginBatch(label);
  }, [history]);

  const updateDrag = useCallback((boothId: string, updates: Partial<Booth>) => {
    const { logoUrl, ...snapUpdates } = updates;
    const next: FloorPlanSnapshot = {
      ...history.present,
      booths: history.present.booths.map((b) => (b.id === boothId ? { ...b, ...snapUpdates } : b)),
    };
    history.updatePresent(next);

    // Debounced save during drag
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!plan) return;
      const updated: FloorPlan = {
        ...plan,
        booths: mergeLogos(next.booths, logosRef.current),
        boundaryPolygon: next.boundaryPolygon,
        bgImage: next.bgImage,
      };
      savePlan(updated);
    }, 300);
  }, [history, plan, savePlan]);

  const endDrag = useCallback((label: string) => {
    history.endBatch(label);
  }, [history]);

  /* ── Polygon drag batching ──────────────────────── */

  const beginPolygonDrag = useCallback(() => {
    history.beginBatch("Moved boundary vertex");
  }, [history]);

  const updatePolygonDrag = useCallback((polygon: Point[]) => {
    const next: FloorPlanSnapshot = { ...history.present, boundaryPolygon: polygon };
    history.updatePresent(next);
  }, [history]);

  const endPolygonDrag = useCallback(() => {
    history.endBatch("Moved boundary vertex");
  }, [history]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Loading floor plan…
      </div>
    );
  }

  if (!plan) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Floor plan not found.</div>;
  }

  return (
    <Ctx.Provider
      value={{
        plan,
        booths: currentBooths,
        bgImage: currentBgImage,
        boundaryPolygon: currentPolygon,
        canvasWidth: plan.canvasWidth,
        canvasHeight: plan.canvasHeight,
        addBooth,
        updateBooth,
        deleteBooth,
        setBooths,
        setBgImage,
        setBoundaryPolygon,
        beginDrag,
        updateDrag,
        endDrag,
        beginPolygonDrag,
        updatePolygonDrag,
        endPolygonDrag,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        historyEntries: history.past,
        restoreTo: history.restoreTo,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useActivePlan() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActivePlan must be used within ActivePlanProvider");
  return ctx;
}
