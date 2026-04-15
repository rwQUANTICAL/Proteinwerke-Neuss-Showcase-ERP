"use client";

import { MdCheck, MdClose, MdAutoAwesome } from "react-icons/md";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_SHORT,
  SCHICHT_TYP_COLORS,
  TEILANLAGE_LABELS,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";
import type { VorschlagItem } from "@/app/lib/entities/zuteilung/vorschlagTypes";

interface VorschlagCellProps {
  vorschlag: VorschlagItem;
  onAccept?: () => void;
  onReject?: () => void;
  showEmployee?: boolean;
}

const CONFIDENCE_DOT: Record<string, string> = {
  high: "bg-success",
  medium: "bg-warning",
  low: "bg-error",
};

export default function VorschlagCell({
  vorschlag,
  onAccept,
  onReject,
  showEmployee = true,
}: VorschlagCellProps) {
  const colors =
    SCHICHT_TYP_COLORS[vorschlag.schicht] ?? SCHICHT_TYP_COLORS.FRUEH;

  return (
    <div
      className={`relative flex flex-col gap-0.5 rounded border-2 border-dashed px-1 py-0.5 sm:px-1.5 sm:py-1 text-xs opacity-80 ${colors.border} ${colors.bg}`}
    >
      <div className="flex items-center justify-between gap-0.5 sm:gap-1">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          <MdAutoAwesome className="size-3 text-accent shrink-0" />
          <span className={`font-semibold truncate ${colors.text}`}>
            <span className="sm:hidden text-[10px]">
              {SCHICHT_TYP_SHORT[vorschlag.schicht] ?? SCHICHT_TYP_LABELS[vorschlag.schicht]}
            </span>
            <span className="hidden sm:inline">
              {SCHICHT_TYP_LABELS[vorschlag.schicht]}
            </span>
          </span>
          <span
            className={`inline-block size-1.5 rounded-full shrink-0 ${CONFIDENCE_DOT[vorschlag.confidence]}`}
          />
        </div>
        <div className="flex gap-0.5 shrink-0">
          {onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="btn btn-ghost btn-xs btn-circle text-success"
              title="Übernehmen"
            >
              <MdCheck className="size-3.5" />
            </button>
          )}
          {onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              className="btn btn-ghost btn-xs btn-circle text-error"
              title="Ablehnen"
            >
              <MdClose className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <span className="text-base-content/60 text-[10px] truncate hidden sm:block">
        {vorschlag.teilanlage !== "SPRINGER"
          ? TEILANLAGE_LABELS[vorschlag.teilanlage]
          : "\u00A0"}
      </span>
      {showEmployee && (
        <span className="truncate text-base-content/80 text-[10px]">
          <span className="sm:hidden">
            {vorschlag.mitarbeiterName?.split(" ").pop()}
          </span>
          <span className="hidden sm:inline">
            {vorschlag.mitarbeiterName}
          </span>
        </span>
      )}
    </div>
  );
}
