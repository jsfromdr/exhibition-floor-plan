import { createClient } from "@supabase/supabase-js";
import { FloorPlan, FloorPlanMeta, Booth, Point } from "@/data/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── DB row types ────────────────────────────────────────────

/** Booth as stored in the JSONB column (logoUrl replaced by logoPath). */
interface BoothRow {
  id: string;
  boothNumber: string;
  companyName?: string;
  status: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  category?: string;
  description?: string;
  logoPath?: string;
}

interface FloorPlanRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  canvas_width: number;
  canvas_height: number;
  boundary_polygon: Point[];
  booths: BoothRow[];
  bg_image_path: string | null;
}

// ─── Storage helpers ─────────────────────────────────────────

function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a base64 data URL to a storage bucket. Returns the storage path. */
export async function uploadImage(
  bucket: string,
  path: string,
  dataUrl: string,
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: blob.type });
  if (error) throw error;
  return path;
}

/** Delete a storage object. */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

// ─── Conversion helpers ──────────────────────────────────────

function rowToFloorPlan(row: FloorPlanRow): FloorPlan {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canvasWidth: row.canvas_width,
    canvasHeight: row.canvas_height,
    boundaryPolygon: row.boundary_polygon ?? [],
    bgImage: row.bg_image_path ? getPublicUrl("bg-images", row.bg_image_path) : null,
    booths: (row.booths ?? []).map((b) => ({
      id: b.id,
      boothNumber: b.boothNumber,
      companyName: b.companyName,
      status: b.status as Booth["status"],
      position: b.position,
      dimensions: b.dimensions,
      category: b.category,
      description: b.description,
      logoUrl: b.logoPath ? getPublicUrl("booth-logos", b.logoPath) : undefined,
    })),
  };
}

function rowToMeta(row: FloorPlanRow): FloorPlanMeta {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    boothCount: (row.booths ?? []).length,
  };
}

// ─── Database operations ─────────────────────────────────────

export async function fetchPlanList(): Promise<FloorPlanMeta[]> {
  const { data, error } = await supabase
    .from("floor_plans")
    .select("id, name, created_at, updated_at, booths")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => rowToMeta(r as FloorPlanRow));
}

export async function fetchPlan(id: string): Promise<FloorPlan | null> {
  const { data, error } = await supabase
    .from("floor_plans")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return rowToFloorPlan(data as FloorPlanRow);
}

export async function upsertPlan(
  plan: FloorPlan,
  bgImagePath: string | null,
  boothLogoPaths: Map<string, string>,
): Promise<void> {
  const boothRows: BoothRow[] = plan.booths.map((b) => {
    const { logoUrl, ...rest } = b;
    const logoPath = boothLogoPaths.get(b.id);
    return logoPath ? { ...rest, logoPath } : rest;
  });

  const row = {
    id: plan.id,
    name: plan.name,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
    canvas_width: plan.canvasWidth,
    canvas_height: plan.canvasHeight,
    boundary_polygon: plan.boundaryPolygon,
    booths: boothRows,
    bg_image_path: bgImagePath,
  };

  const { error } = await supabase
    .from("floor_plans")
    .upsert(row, { onConflict: "id" });
  if (error) throw error;
}

export async function deletePlanFromDb(id: string): Promise<void> {
  const { error } = await supabase.from("floor_plans").delete().eq("id", id);
  if (error) throw error;
  // Clean up storage
  await supabase.storage.from("bg-images").remove([`${id}/background`]);
  const { data: logos } = await supabase.storage.from("booth-logos").list(id);
  if (logos && logos.length > 0) {
    await supabase.storage
      .from("booth-logos")
      .remove(logos.map((f) => `${id}/${f.name}`));
  }
}
