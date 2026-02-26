"use client";

import { Booth, STATUS_COLORS } from "@/data/types";

interface Props {
  booth: Booth;
  isSelected: boolean;
  isHighlighted: boolean;
  dimmed: boolean;
  onClick: (booth: Booth) => void;
}

export default function BoothOverlay({ booth, isSelected, isHighlighted, dimmed, onClick }: Props) {
  const colors = STATUS_COLORS[booth.status];

  const ring = isSelected
    ? "ring-2 ring-offset-1 ring-blue-600 dark:ring-blue-400"
    : isHighlighted
      ? "ring-2 ring-offset-1 ring-amber-400"
      : "";

  return (
    <button
      data-booth="true"
      onClick={(e) => {
        e.stopPropagation();
        onClick(booth);
      }}
      className={`absolute flex flex-col items-center justify-center rounded-md transition-all duration-200 cursor-pointer
        hover:brightness-110 hover:scale-[1.03] ${ring}`}
      style={{
        left: booth.position.x,
        top: booth.position.y,
        width: booth.dimensions.width,
        height: booth.dimensions.height,
        backgroundColor: colors.bg,
        borderWidth: 2,
        borderColor: colors.border,
        color: colors.text,
        opacity: dimmed ? 0.3 : 1,
      }}
      title={`${booth.boothNumber}${booth.companyName ? ` – ${booth.companyName}` : ""}`}
    >
      {booth.logoUrl && booth.dimensions.width >= 80 && booth.dimensions.height >= 60 && (
        <img src={booth.logoUrl} alt="" className="max-h-[35%] max-w-[55%] object-contain opacity-70 pointer-events-none" />
      )}
      <span className="text-[11px] font-bold leading-tight">{booth.boothNumber}</span>
      {booth.companyName && (
        <span className="mt-0.5 max-w-[90%] truncate text-[9px] leading-tight opacity-80">
          {booth.companyName}
        </span>
      )}
    </button>
  );
}
