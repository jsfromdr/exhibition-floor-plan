import { Point } from "@/data/types";

/** Ray-casting algorithm: returns true if (px, py) is inside the polygon. */
export function pointInPolygon(px: number, py: number, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/** Returns true if all four corners of a rectangle are inside the polygon. */
export function rectInPolygon(x: number, y: number, w: number, h: number, polygon: Point[]): boolean {
  return (
    pointInPolygon(x, y, polygon) &&
    pointInPolygon(x + w, y, polygon) &&
    pointInPolygon(x + w, y + h, polygon) &&
    pointInPolygon(x, y + h, polygon)
  );
}

/** Convert polygon vertices to an SVG points attribute string. */
export function polygonToSvgPoints(polygon: Point[]): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(" ");
}

/** Find the index after which to insert a new vertex (nearest edge). */
export function nearestEdgeIndex(px: number, py: number, polygon: Point[]): number {
  let minDist = Infinity;
  let bestIdx = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dist = distToSegment(px, py, polygon[i], polygon[j]);
    if (dist < minDist) {
      minDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx + 1;
}

function distToSegment(px: number, py: number, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - a.x, py - a.y);
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}
