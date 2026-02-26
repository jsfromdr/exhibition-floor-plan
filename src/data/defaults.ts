import { FloorPlan, Point } from "./types";
import { SAMPLE_BOOTHS } from "./booths";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Default rectangular boundary matching canvas dimensions. */
export function defaultBoundary(w: number, h: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}

export function createDefaultFloorPlan(): FloorPlan {
  const now = new Date().toISOString();
  return {
    id: genId(),
    name: "Sample Exhibition",
    createdAt: now,
    updatedAt: now,
    canvasWidth: 1060,
    canvasHeight: 700,
    boundaryPolygon: defaultBoundary(1060, 700),
    bgImage: null,
    booths: SAMPLE_BOOTHS,
  };
}

export function createEmptyFloorPlan(name: string, width = 1060, height = 700): FloorPlan {
  const now = new Date().toISOString();
  return {
    id: genId(),
    name,
    createdAt: now,
    updatedAt: now,
    canvasWidth: width,
    canvasHeight: height,
    boundaryPolygon: defaultBoundary(width, height),
    bgImage: null,
    booths: [],
  };
}
