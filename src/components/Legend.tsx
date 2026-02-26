"use client";

import { Booth, BoothStatus, STATUS_COLORS } from "@/data/types";

const STATUSES: BoothStatus[] = ["Available", "Sold", "Option", "Reserved"];

interface Props {
  booths: Booth[];
}

/** Shows colour legend + counts per status */
export default function Legend({ booths }: Props) {
  const counts: Record<BoothStatus, number> = { Available: 0, Sold: 0, Option: 0, Reserved: 0 };
  booths.forEach((b) => counts[b.status]++);

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      {STATUSES.map((s) => {
        const c = STATUS_COLORS[s];
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {s} ({counts[s]})
            </span>
          </div>
        );
      })}
    </div>
  );
}
