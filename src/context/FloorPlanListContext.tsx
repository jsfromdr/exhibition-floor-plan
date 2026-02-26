"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { FloorPlan, FloorPlanMeta, Booth } from "@/data/types";
import { createDefaultFloorPlan, createEmptyFloorPlan } from "@/data/defaults";
import {
  supabase,
  fetchPlanList,
  fetchPlan,
  upsertPlan,
  deletePlanFromDb,
  uploadImage,
  deleteImage,
} from "@/lib/supabase";

interface FloorPlanListContextValue {
  plans: FloorPlanMeta[];
  loaded: boolean;
  error: string | null;
  createPlan: (name: string, width?: number, height?: number) => Promise<string>;
  duplicatePlan: (id: string) => Promise<string | null>;
  deletePlan: (id: string) => Promise<void>;
  renamePlan: (id: string, name: string) => Promise<void>;
  loadPlan: (id: string) => Promise<FloorPlan | null>;
  savePlan: (plan: FloorPlan) => void;
}

const Ctx = createContext<FloorPlanListContextValue | null>(null);

function planToMeta(p: FloorPlan): FloorPlanMeta {
  return {
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    boothCount: p.booths.length,
  };
}

/** Track bg-image storage paths per plan. */
type ImagePaths = Map<string, string>;
/** Track booth logo storage paths per plan: planId -> Map<boothId, storagePath> */
type LogoPaths = Map<string, Map<string, string>>;

export function FloorPlanListProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<FloorPlanMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Storage path caches (so we don't re-upload unchanged images)
  const bgPathsRef = useRef<ImagePaths>(new Map());
  const logoPathsRef = useRef<LogoPaths>(new Map());

  // Debounced save state
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<FloorPlan | null>(null);

  // ── Init: load from Supabase, migrate localStorage if needed ──
  useEffect(() => {
    async function init() {
      try {
        const remotePlans = await fetchPlanList();

        if (remotePlans.length > 0) {
          setPlans(remotePlans);
          setLoaded(true);
          return;
        }

        // No Supabase data — check for localStorage data to migrate
        const localIndex = localStorage.getItem("floorplans-index");
        if (localIndex) {
          const metas: FloorPlanMeta[] = JSON.parse(localIndex);
          const migrated: FloorPlanMeta[] = [];

          for (const meta of metas) {
            const raw = localStorage.getItem(`floorplan-${meta.id}`);
            if (!raw) continue;
            const plan: FloorPlan = JSON.parse(raw);

            // Upload bg image if present
            let bgPath: string | null = null;
            if (plan.bgImage?.startsWith("data:")) {
              try {
                bgPath = await uploadImage("bg-images", `${plan.id}/background`, plan.bgImage);
                bgPathsRef.current.set(plan.id, bgPath);
              } catch { /* skip image on failure */ }
            }

            // Upload booth logos
            const boothLogos = new Map<string, string>();
            for (const booth of plan.booths) {
              if (booth.logoUrl?.startsWith("data:")) {
                try {
                  const logoPath = `${plan.id}/${booth.id}.jpg`;
                  await uploadImage("booth-logos", logoPath, booth.logoUrl);
                  boothLogos.set(booth.id, logoPath);
                } catch { /* skip logo on failure */ }
              }
            }
            if (boothLogos.size > 0) logoPathsRef.current.set(plan.id, boothLogos);

            await upsertPlan(plan, bgPath, boothLogos);
            migrated.push(planToMeta(plan));
          }

          if (migrated.length > 0) {
            setPlans(migrated);
            // Clean up localStorage after migration
            for (const meta of metas) localStorage.removeItem(`floorplan-${meta.id}`);
            localStorage.removeItem("floorplans-index");
            localStorage.removeItem("exhibition-booths");
            localStorage.removeItem("exhibition-bg-image");
          }
        } else {
          // Check legacy single-plan keys
          const legacyBooths = localStorage.getItem("exhibition-booths");
          if (legacyBooths) {
            const plan = createDefaultFloorPlan();
            plan.booths = JSON.parse(legacyBooths);
            const legacyBg = localStorage.getItem("exhibition-bg-image");
            if (legacyBg) plan.bgImage = legacyBg;
            await upsertPlan(plan, null, new Map());
            setPlans([planToMeta(plan)]);
            localStorage.removeItem("exhibition-booths");
            localStorage.removeItem("exhibition-bg-image");
          } else {
            // First time ever — create a sample plan in Supabase
            const plan = createDefaultFloorPlan();
            await upsertPlan(plan, null, new Map());
            setPlans([planToMeta(plan)]);
          }
        }
      } catch (err: unknown) {
        const e = err as Record<string, unknown>;
        console.error("Failed to initialize floor plans:", e?.message ?? e?.details ?? JSON.stringify(err));
        setError("Unable to load floor plans. Please check your connection and Supabase config.");
      }
      setLoaded(true);
    }

    init();
  }, []);

  // ── loadPlan (async) ──────────────────────────────────────

  const loadPlan = useCallback(async (id: string): Promise<FloorPlan | null> => {
    try {
      const plan = await fetchPlan(id);
      if (plan) {
        // Cache the bg image path from the loaded plan's bgImage URL
        if (plan.bgImage && !plan.bgImage.startsWith("data:")) {
          // Extract storage path from the public URL
          const match = plan.bgImage.match(/\/bg-images\/(.+)$/);
          if (match) bgPathsRef.current.set(id, match[1]);
        }
        // Cache booth logo paths
        const logos = new Map<string, string>();
        for (const booth of plan.booths) {
          if (booth.logoUrl && !booth.logoUrl.startsWith("data:")) {
            const match = booth.logoUrl.match(/\/booth-logos\/(.+)$/);
            if (match) logos.set(booth.id, match[1]);
          }
        }
        if (logos.size > 0) logoPathsRef.current.set(id, logos);
      }
      return plan;
    } catch (err) {
      console.error("Failed to load plan:", err);
      return null;
    }
  }, []);

  // ── savePlan (debounced, fire-and-forget) ──────────────────

  const doSave = useCallback(async (plan: FloorPlan) => {
    try {
      // Upload bg image if it's a data URL
      let bgPath = bgPathsRef.current.get(plan.id) ?? null;
      if (plan.bgImage?.startsWith("data:")) {
        bgPath = await uploadImage("bg-images", `${plan.id}/background`, plan.bgImage);
        bgPathsRef.current.set(plan.id, bgPath);
      } else if (!plan.bgImage && bgPath) {
        await deleteImage("bg-images", bgPath);
        bgPathsRef.current.delete(plan.id);
        bgPath = null;
      }

      // Upload booth logos that are data URLs
      const boothLogos = logoPathsRef.current.get(plan.id) ?? new Map<string, string>();
      for (const booth of plan.booths) {
        if (booth.logoUrl?.startsWith("data:")) {
          const logoPath = `${plan.id}/${booth.id}.jpg`;
          await uploadImage("booth-logos", logoPath, booth.logoUrl);
          boothLogos.set(booth.id, logoPath);
        }
      }
      logoPathsRef.current.set(plan.id, boothLogos);

      await upsertPlan(plan, bgPath, boothLogos);
    } catch (err) {
      console.error("Failed to save plan to Supabase:", err);
    }
  }, []);

  const savePlan = useCallback((plan: FloorPlan) => {
    plan.updatedAt = new Date().toISOString();

    // Optimistic UI update
    setPlans((prev) => {
      const meta = planToMeta(plan);
      const idx = prev.findIndex((p) => p.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = meta;
        return next;
      }
      return [...prev, meta];
    });

    // Debounced Supabase write (1 second)
    pendingSaveRef.current = plan;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const p = pendingSaveRef.current;
      if (p) {
        pendingSaveRef.current = null;
        doSave(p);
      }
    }, 1000);
  }, [doSave]);

  // ── createPlan ─────────────────────────────────────────────

  const createPlan = useCallback(async (name: string, width?: number, height?: number): Promise<string> => {
    const plan = createEmptyFloorPlan(name, width, height);

    // Optimistic
    setPlans((prev) => [...prev, planToMeta(plan)]);

    try {
      await upsertPlan(plan, null, new Map());
    } catch (err) {
      console.error("Failed to create plan:", err);
    }
    return plan.id;
  }, []);

  // ── duplicatePlan ──────────────────────────────────────────

  const duplicatePlan = useCallback(async (id: string): Promise<string | null> => {
    const original = await fetchPlan(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const dup: FloorPlan = {
      ...original,
      id: newId,
      name: `${original.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic
    setPlans((prev) => [...prev, planToMeta(dup)]);

    try {
      // Copy bg image in storage
      let bgPath: string | null = null;
      const origBgPath = bgPathsRef.current.get(id);
      if (origBgPath) {
        const { data: bgBlob } = await supabase.storage.from("bg-images").download(origBgPath);
        if (bgBlob) {
          bgPath = `${newId}/background`;
          await supabase.storage.from("bg-images").upload(bgPath, bgBlob, { upsert: true });
          bgPathsRef.current.set(newId, bgPath);
        }
      }

      // Copy booth logos
      const origLogos = logoPathsRef.current.get(id);
      const newLogos = new Map<string, string>();
      if (origLogos) {
        for (const [boothId, logoPath] of origLogos) {
          const { data: logoBlob } = await supabase.storage.from("booth-logos").download(logoPath);
          if (logoBlob) {
            const newLogoPath = `${newId}/${boothId}.jpg`;
            await supabase.storage.from("booth-logos").upload(newLogoPath, logoBlob, { upsert: true });
            newLogos.set(boothId, newLogoPath);
          }
        }
      }
      logoPathsRef.current.set(newId, newLogos);

      await upsertPlan(dup, bgPath, newLogos);
    } catch (err) {
      console.error("Failed to duplicate plan:", err);
    }
    return newId;
  }, []);

  // ── deletePlan ─────────────────────────────────────────────

  const deletePlan = useCallback(async (id: string): Promise<void> => {
    // Optimistic
    setPlans((prev) => prev.filter((p) => p.id !== id));
    bgPathsRef.current.delete(id);
    logoPathsRef.current.delete(id);

    try {
      await deletePlanFromDb(id);
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  }, []);

  // ── renamePlan ─────────────────────────────────────────────

  const renamePlan = useCallback(async (id: string, name: string): Promise<void> => {
    const now = new Date().toISOString();

    // Optimistic
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, name, updatedAt: now } : p)));

    try {
      const { error } = await supabase
        .from("floor_plans")
        .update({ name, updated_at: now })
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to rename plan:", err);
    }
  }, []);

  return (
    <Ctx.Provider value={{ plans, loaded, error, createPlan, duplicatePlan, deletePlan, renamePlan, loadPlan, savePlan }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFloorPlanList() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFloorPlanList must be used within FloorPlanListProvider");
  return ctx;
}
