"use client";

import { useCallback, useRef, useState } from "react";

interface Transform {
  scale: number;
  x: number;
  y: number;
}

/**
 * Manages zoom / pan state for the floor-plan canvas.
 * Canvas dimensions are passed in from the active plan.
 */
export function useFloorPlan() {
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const zoom = useCallback((delta: number) => {
    setTransform((t) => {
      const next = Math.min(4, Math.max(0.25, t.scale + delta));
      return { ...t, scale: next };
    });
  }, []);

  const zoomIn = useCallback(() => zoom(0.2), [zoom]);
  const zoomOut = useCallback(() => zoom(-0.2), [zoom]);
  const resetView = useCallback(() => setTransform({ scale: 1, x: 0, y: 0 }), []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 0.1 : -0.1);
    },
    [zoom],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).dataset.booth) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return {
    transform,
    zoomIn,
    zoomOut,
    resetView,
    handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp },
  };
}
