"use client";

import { Booth, Point } from "@/data/types";
import { useFloorPlan } from "@/hooks/useFloorPlan";
import { polygonToSvgPoints } from "@/utils/geometry";
import BoothOverlay from "./BoothOverlay";
import Sidebar from "./Sidebar";
import ZoomControls from "./ZoomControls";

interface Props {
  booths: Booth[];
  selectedBooth: Booth | null;
  highlightedIds: Set<string>;
  onSelectBooth: (booth: Booth | null) => void;
  bgImage?: string | null;
  boundaryPolygon: Point[];
  canvasWidth: number;
  canvasHeight: number;
}

export default function FloorPlanCanvas({
  booths, selectedBooth, highlightedIds, onSelectBooth,
  bgImage, boundaryPolygon, canvasWidth, canvasHeight,
}: Props) {
  const { transform, handlers, zoomIn, zoomOut, resetView } = useFloorPlan();
  const hasFilter = highlightedIds.size > 0;

  return (
    <div className="relative flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="absolute right-4 top-4 z-20">
        <ZoomControls scale={transform.scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      </div>

      <div className="h-full w-full cursor-grab active:cursor-grabbing touch-none" {...handlers}>
        <div
          className="origin-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            width: canvasWidth,
            height: canvasHeight,
            margin: "40px auto",
          }}
        >
          <div
            className="relative rounded-xl"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              backgroundImage: bgImage ? `url(${bgImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: bgImage ? undefined : "rgb(243 244 246)",
            }}
          >
            {/* SVG polygon boundary overlay */}
            {boundaryPolygon.length >= 3 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={canvasWidth}
                height={canvasHeight}
              >
                <defs>
                  <mask id="hall-mask-view">
                    <rect width="100%" height="100%" fill="white" />
                    <polygon points={polygonToSvgPoints(boundaryPolygon)} fill="black" />
                  </mask>
                </defs>
                {/* Gray out area outside polygon */}
                <rect width="100%" height="100%" fill="rgba(128,128,128,0.3)" mask="url(#hall-mask-view)" />
                {/* Polygon border */}
                <polygon
                  points={polygonToSvgPoints(boundaryPolygon)}
                  fill="none"
                  stroke="rgba(156,163,175,0.5)"
                  strokeWidth={2}
                  strokeDasharray="8,4"
                />
              </svg>
            )}

            {/* Booth overlays */}
            {booths.map((booth) => (
              <BoothOverlay
                key={booth.id}
                booth={booth}
                isSelected={selectedBooth?.id === booth.id}
                isHighlighted={highlightedIds.has(booth.id)}
                dimmed={hasFilter && !highlightedIds.has(booth.id)}
                onClick={onSelectBooth}
              />
            ))}
          </div>
        </div>
      </div>

      <Sidebar booth={selectedBooth} onClose={() => onSelectBooth(null)} />
    </div>
  );
}
