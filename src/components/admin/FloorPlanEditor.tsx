"use client";

import { useCallback, useRef, useState } from "react";
import { Booth, STATUS_COLORS, BoothStatus, Point } from "@/data/types";
import { useActivePlan } from "@/context/ActivePlanContext";
import { polygonToSvgPoints, nearestEdgeIndex } from "@/utils/geometry";
import BoothFormModal from "./BoothFormModal";

function snap(v: number, grid = 10) {
  return Math.round(v / grid) * grid;
}

type DragMode = "move" | "resize-br" | null;
type EditMode = "booths" | "boundary";

export default function FloorPlanEditor() {
  const {
    booths, addBooth, updateBooth, deleteBooth,
    bgImage, setBgImage,
    boundaryPolygon, setBoundaryPolygon,
    canvasWidth, canvasHeight,
    beginDrag, updateDrag, endDrag,
    beginPolygonDrag, updatePolygonDrag, endPolygonDrag,
  } = useActivePlan();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Mode
  const [editMode, setEditMode] = useState<EditMode>("booths");

  // Booth interaction state
  const [activeBooth, setActiveBooth] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [origBooth, setOrigBooth] = useState<Booth | null>(null);

  // Polygon vertex drag state
  const [draggingVertex, setDraggingVertex] = useState<number | null>(null);
  const [vertexDragStart, setVertexDragStart] = useState({ x: 0, y: 0 });
  const [origVertex, setOrigVertex] = useState<Point | null>(null);

  // Modals
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [creatingAt, setCreatingAt] = useState<{ x: number; y: number } | null>(null);

  const canvasCoords = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  /* ── Booth drag handlers ────────────────────────── */
  const handleBoothPointerDown = useCallback(
    (e: React.PointerEvent, boothId: string, mode: DragMode) => {
      if (editMode !== "booths") return;
      e.stopPropagation();
      e.preventDefault();
      const booth = booths.find((b) => b.id === boothId);
      if (!booth) return;
      setActiveBooth(boothId);
      setDragMode(mode);
      setDragStart(canvasCoords(e));
      setOrigBooth({ ...booth, position: { ...booth.position }, dimensions: { ...booth.dimensions } });
      beginDrag(mode === "move" ? `Moved booth ${booth.boothNumber}` : `Resized booth ${booth.boothNumber}`);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [booths, canvasCoords, editMode, beginDrag],
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Booth drag
      if (dragMode && origBooth && activeBooth) {
        const pos = canvasCoords(e);
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        if (dragMode === "move") {
          updateDrag(activeBooth, {
            position: {
              x: snap(Math.max(0, Math.min(canvasWidth - origBooth.dimensions.width, origBooth.position.x + dx))),
              y: snap(Math.max(0, Math.min(canvasHeight - origBooth.dimensions.height, origBooth.position.y + dy))),
            },
          });
        } else if (dragMode === "resize-br") {
          updateDrag(activeBooth, {
            dimensions: {
              width: snap(Math.max(40, origBooth.dimensions.width + dx)),
              height: snap(Math.max(40, origBooth.dimensions.height + dy)),
            },
          });
        }
        return;
      }

      // Vertex drag
      if (draggingVertex !== null && origVertex) {
        const pos = canvasCoords(e);
        const dx = pos.x - vertexDragStart.x;
        const dy = pos.y - vertexDragStart.y;
        const newPoly = [...boundaryPolygon];
        newPoly[draggingVertex] = {
          x: snap(Math.max(0, Math.min(canvasWidth, origVertex.x + dx))),
          y: snap(Math.max(0, Math.min(canvasHeight, origVertex.y + dy))),
        };
        updatePolygonDrag(newPoly);
      }
    },
    [dragMode, origBooth, activeBooth, dragStart, canvasCoords, canvasWidth, canvasHeight, updateDrag, draggingVertex, origVertex, vertexDragStart, boundaryPolygon, updatePolygonDrag],
  );

  const handleCanvasPointerUp = useCallback(() => {
    if (dragMode && activeBooth) {
      const label = dragMode === "move" ? "Moved booth" : "Resized booth";
      endDrag(label);
      setDragMode(null);
      setOrigBooth(null);
    }
    if (draggingVertex !== null) {
      endPolygonDrag();
      setDraggingVertex(null);
      setOrigVertex(null);
    }
  }, [dragMode, activeBooth, endDrag, draggingVertex, endPolygonDrag]);

  /* ── Polygon vertex handlers ────────────────────── */
  const handleVertexPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      setDraggingVertex(index);
      setVertexDragStart(canvasCoords(e));
      setOrigVertex({ ...boundaryPolygon[index] });
      beginPolygonDrag();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [canvasCoords, boundaryPolygon, beginPolygonDrag],
  );

  const handleAddVertex = useCallback(
    (e: React.MouseEvent) => {
      const pos = canvasCoords(e);
      const idx = nearestEdgeIndex(pos.x, pos.y, boundaryPolygon);
      const newPoly = [...boundaryPolygon];
      newPoly.splice(idx, 0, { x: snap(pos.x), y: snap(pos.y) });
      setBoundaryPolygon(newPoly);
    },
    [canvasCoords, boundaryPolygon, setBoundaryPolygon],
  );

  const handleRemoveVertex = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (boundaryPolygon.length <= 3) return;
      const newPoly = boundaryPolygon.filter((_, i) => i !== index);
      setBoundaryPolygon(newPoly);
    },
    [boundaryPolygon, setBoundaryPolygon],
  );

  /* ── Canvas double-click to create booth ────────── */
  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editMode === "boundary") {
        handleAddVertex(e);
        return;
      }
      const pos = canvasCoords(e);
      setCreatingAt({ x: snap(pos.x), y: snap(pos.y) });
    },
    [canvasCoords, editMode, handleAddVertex],
  );

  /* ── Image upload ───────────────────────────────── */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Save from modal ────────────────────────────── */
  const handleSave = (booth: Booth) => {
    if (editingBooth) {
      updateBooth(booth.id, booth);
    } else {
      addBooth(booth);
    }
    setEditingBooth(null);
    setCreatingAt(null);
  };

  const selected = activeBooth ? booths.find((b) => b.id === activeBooth) : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button
            onClick={() => setEditMode("booths")}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              editMode === "booths"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Edit Booths
          </button>
          <button
            onClick={() => setEditMode("boundary")}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              editMode === "boundary"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Edit Boundary
          </button>
        </div>

        <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition">
          Upload Background
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        {bgImage && (
          <button onClick={() => setBgImage(null)} className="text-xs text-red-500 hover:text-red-700">
            Remove Image
          </button>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {editMode === "booths"
            ? "Double-click to add booth. Drag to move. Corner handle to resize."
            : "Drag vertices to reshape. Double-click edge to add vertex. Right-click vertex to remove."}
        </span>
      </div>

      {/* Canvas */}
      <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        <div
          ref={canvasRef}
          className="relative mx-auto rounded-lg"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: bgImage ? undefined : "rgb(243 244 246)",
          }}
          onDoubleClick={handleCanvasDoubleClick}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
        >
          {/* Polygon boundary SVG */}
          {boundaryPolygon.length >= 3 && (
            <svg
              className="absolute inset-0"
              width={canvasWidth}
              height={canvasHeight}
              style={{ pointerEvents: editMode === "boundary" ? "auto" : "none" }}
            >
              <defs>
                <mask id="hall-mask-editor">
                  <rect width="100%" height="100%" fill="white" />
                  <polygon points={polygonToSvgPoints(boundaryPolygon)} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(128,128,128,0.25)" mask="url(#hall-mask-editor)" />
              <polygon
                points={polygonToSvgPoints(boundaryPolygon)}
                fill={editMode === "boundary" ? "rgba(59,130,246,0.08)" : "none"}
                stroke={editMode === "boundary" ? "#3b82f6" : "rgba(156,163,175,0.5)"}
                strokeWidth={2}
                strokeDasharray={editMode === "boundary" ? undefined : "8,4"}
              />

              {/* Vertex handles (boundary mode only) */}
              {editMode === "boundary" && (
                <>
                  {/* Edge midpoints for adding vertices */}
                  {boundaryPolygon.map((p, i) => {
                    const next = boundaryPolygon[(i + 1) % boundaryPolygon.length];
                    const mx = (p.x + next.x) / 2;
                    const my = (p.y + next.y) / 2;
                    return (
                      <circle
                        key={`mid-${i}`}
                        cx={mx}
                        cy={my}
                        r={4}
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth={1}
                        className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          const newPoly = [...boundaryPolygon];
                          newPoly.splice(i + 1, 0, { x: snap(mx), y: snap(my) });
                          setBoundaryPolygon(newPoly);
                        }}
                      />
                    );
                  })}

                  {/* Vertex handles */}
                  {boundaryPolygon.map((p, i) => (
                    <circle
                      key={`v-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={6}
                      fill="white"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      className="cursor-move"
                      onPointerDown={(e) => handleVertexPointerDown(e, i)}
                      onContextMenu={(e) => handleRemoveVertex(e, i)}
                    />
                  ))}
                </>
              )}
            </svg>
          )}

          {/* Booths */}
          {booths.map((booth) => {
            const c = STATUS_COLORS[booth.status];
            const isActive = activeBooth === booth.id;

            return (
              <div
                key={booth.id}
                className={`absolute flex flex-col items-center justify-center rounded-md select-none
                  ${editMode === "booths" ? "cursor-move" : "pointer-events-none opacity-60"}
                  ${isActive && editMode === "booths" ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                style={{
                  left: booth.position.x,
                  top: booth.position.y,
                  width: booth.dimensions.width,
                  height: booth.dimensions.height,
                  backgroundColor: c.bg,
                  borderWidth: 2,
                  borderColor: c.border,
                  color: c.text,
                }}
                onPointerDown={(e) => {
                  setActiveBooth(booth.id);
                  handleBoothPointerDown(e, booth.id, "move");
                }}
                onDoubleClick={(e) => {
                  if (editMode !== "booths") return;
                  e.stopPropagation();
                  setEditingBooth(booth);
                }}
              >
                <span className="text-[11px] font-bold leading-tight pointer-events-none">{booth.boothNumber}</span>
                {booth.companyName && (
                  <span className="mt-0.5 max-w-[90%] truncate text-[9px] leading-tight opacity-80 pointer-events-none">
                    {booth.companyName}
                  </span>
                )}

                {/* Resize handle */}
                {editMode === "booths" && (
                  <div
                    className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
                    style={{ opacity: isActive ? 1 : undefined }}
                    onPointerDown={(e) => handleBoothPointerDown(e, booth.id, "resize-br")}
                  />
                )}
              </div>
            );
          })}

          {/* Placeholder text */}
          {!bgImage && booths.length === 0 && editMode === "booths" && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-gray-300 dark:text-gray-700 select-none pointer-events-none">
              Double-click to place a booth
            </span>
          )}
        </div>
      </div>

      {/* Selected booth info bar */}
      {selected && editMode === "booths" && (
        <div className="flex items-center gap-4 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{selected.boothNumber}</span>
          <span className="text-gray-500 dark:text-gray-400">
            pos ({selected.position.x}, {selected.position.y}) &middot; {selected.dimensions.width}×{selected.dimensions.height}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setEditingBooth(selected)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Edit Details
            </button>
            <button
              onClick={() => { deleteBooth(selected.id); setActiveBooth(null); }}
              className="text-xs font-medium text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Boundary info */}
      {editMode === "boundary" && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-xs text-blue-700 dark:text-blue-300">
          {boundaryPolygon.length} vertices &middot; Drag to move &middot; Double-click edge to add &middot; Right-click to remove (min 3)
        </div>
      )}

      {/* Modal */}
      {(editingBooth || creatingAt) && (
        <BoothFormModal
          booth={
            editingBooth ??
            ({
              id: "",
              boothNumber: "",
              status: "Available" as BoothStatus,
              position: creatingAt ?? { x: 100, y: 100 },
              dimensions: { width: 160, height: 120 },
            } as Booth)
          }
          onSave={handleSave}
          onCancel={() => { setEditingBooth(null); setCreatingAt(null); }}
        />
      )}
    </div>
  );
}
