export type BoothStatus = "Available" | "Sold" | "Option" | "Reserved";

export interface Point {
  x: number;
  y: number;
}

export interface Booth {
  id: string;
  boothNumber: string;
  companyName?: string;
  status: BoothStatus;
  /** Top-left corner position in floor-plan pixels */
  position: { x: number; y: number };
  /** Size in floor-plan pixels */
  dimensions: { width: number; height: number };
  category?: string;
  description?: string;
  /** Base64 data URL for exhibitor logo (compressed to ~200×200) */
  logoUrl?: string;
}

/** A booth without logoUrl — used in history snapshots to save space */
export type BoothSnapshot = Omit<Booth, "logoUrl">;

export interface FloorPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvasWidth: number;
  canvasHeight: number;
  /** Hall boundary polygon vertices (ordered). Min 3 points. */
  boundaryPolygon: Point[];
  bgImage?: string | null;
  booths: Booth[];
}

/** The mutable parts of a FloorPlan that get versioned by undo/redo */
export interface FloorPlanSnapshot {
  booths: BoothSnapshot[];
  boundaryPolygon: Point[];
  bgImage?: string | null;
}

export interface HistoryEntry {
  timestamp: number;
  label: string;
  snapshot: FloorPlanSnapshot;
}

/** Lightweight metadata for the floor plan list (no booths/images) */
export interface FloorPlanMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  boothCount: number;
}

/** Map from status → colour used for booth overlays */
export const STATUS_COLORS: Record<BoothStatus, { bg: string; border: string; text: string }> = {
  Available: { bg: "rgba(209,213,219,0.55)", border: "#9ca3af", text: "#374151" },
  Sold:      { bg: "rgba(96,165,250,0.55)",  border: "#3b82f6", text: "#1e3a5f" },
  Option:    { bg: "rgba(253,224,71,0.55)",   border: "#eab308", text: "#713f12" },
  Reserved:  { bg: "rgba(74,222,128,0.55)",   border: "#22c55e", text: "#14532d" },
};
