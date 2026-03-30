"use client";

import { MdClose, MdEdit, MdContentCopy } from "react-icons/md";
import type { ZuteilungWithRelations } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_SHORT,
  SCHICHT_TYP_COLORS,
  SCHICHT_TYP_PATTERNS,
  TEILANLAGE_LABELS,
  SKILL_SHORT,
  SKILL_LABELS,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";

interface ZuteilungCellProps {
  zuteilung: ZuteilungWithRelations;
  showEmployee?: boolean;
  showFacility?: boolean;
  showSkills?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (zuteilung: ZuteilungWithRelations) => void;
  onCopy?: (zuteilung: ZuteilungWithRelations) => void;
  dimmed?: boolean;
}

export default function ZuteilungCell({
  zuteilung,
  showEmployee = true,
  showFacility = true,
  showSkills = true,
  onDelete,
  onEdit,
  onCopy,
  dimmed = false,
}: ZuteilungCellProps) {
  const isSpringerRole =
    zuteilung.teilanlage === "SPRINGER" &&
    !["X_FREI", "URLAUB", "KRANK"].includes(zuteilung.schicht);

  const colors = isSpringerRole
    ? SCHICHT_TYP_COLORS["SPRINGER"]
    : SCHICHT_TYP_COLORS[zuteilung.schicht];
  const pattern = SCHICHT_TYP_PATTERNS[zuteilung.schicht];

  const title = isSpringerRole
    ? "Springer"
    : SCHICHT_TYP_LABELS[zuteilung.schicht];
  const shortTitle = isSpringerRole
    ? "Sp"
    : (SCHICHT_TYP_SHORT[zuteilung.schicht] ?? title);
  const subtitle =
    isSpringerRole && zuteilung.schicht !== "SPRINGER"
      ? SCHICHT_TYP_LABELS[zuteilung.schicht]
      : null;

  return (
    <div
      className={`relative group rounded sm:rounded-lg px-0.5 py-0.5 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs border w-full min-h-[1.5rem] sm:min-h-[3rem] flex flex-col items-center sm:items-start justify-center transition-all
        ${colors?.bg ?? "bg-base-200"} ${colors?.border ?? "border-base-300"} ${colors?.text ?? "text-base-content"}
        ${dimmed ? "opacity-25 grayscale" : ""}`}
      style={pattern ? { backgroundImage: pattern } : undefined}
    >
      {/* Action buttons — top-right on hover */}
      <div className="absolute -top-1.5 right-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onCopy && (
          <button
            type="button"
            className="size-4 rounded-full bg-base-100 border border-base-300
              text-base-content/50 hover:text-info hover:border-info/30
              flex items-center justify-center"
            onClick={() => onCopy(zuteilung)}
          >
            <MdContentCopy className="size-2.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            className="size-4 rounded-full bg-base-100 border border-base-300
              text-base-content/50 hover:text-warning hover:border-warning/30
              flex items-center justify-center"
            onClick={() => onEdit(zuteilung)}
          >
            <MdEdit className="size-2.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="size-4 rounded-full bg-base-100 border border-base-300
              text-base-content/50 hover:text-error hover:border-error/30
              flex items-center justify-center"
            onClick={() => onDelete(zuteilung.id)}
          >
            <MdClose className="size-2.5" />
          </button>
        )}
      </div>
      <div className="font-semibold truncate">
        <span className="sm:hidden">{shortTitle}</span>
        <span className="hidden sm:inline">{title}</span>
      </div>
      {subtitle && <div className="truncate opacity-70 hidden sm:block">{subtitle}</div>}
      {showFacility &&
        !isSpringerRole &&
        zuteilung.teilanlage !== "SPRINGER" && (
          <>
            <div className="truncate hidden sm:block">
              {TEILANLAGE_LABELS[zuteilung.teilanlage]}
            </div>
            <div className="truncate sm:hidden text-[7px] leading-tight opacity-80">
              {TEILANLAGE_LABELS[zuteilung.teilanlage]}
            </div>
          </>
        )}
      {/* Ensure consistent height on mobile when no facility line */}
      {!showFacility && (
        <div className="sm:hidden text-[7px] leading-tight">&nbsp;</div>
      )}
      {showFacility && (isSpringerRole || zuteilung.teilanlage === "SPRINGER") && (
        <div className="sm:hidden text-[7px] leading-tight">&nbsp;</div>
      )}
      {isSpringerRole && showSkills && (
        <div className="gap-0.5 mt-0.5 hidden sm:flex">
          {zuteilung.mitarbeiter.skills.map((s) => (
            <span
              key={s}
              className="badge badge-xs badge-outline border-current/30"
              title={SKILL_LABELS[s] ?? s}
            >
              {SKILL_SHORT[s] ?? s}
            </span>
          ))}
        </div>
      )}
      {showEmployee && (
        <>
          <div className="truncate hidden sm:block">{zuteilung.mitarbeiter.name}</div>
          <div className="truncate sm:hidden text-[7px] leading-tight opacity-80">
            {zuteilung.mitarbeiter.name.split(" ").pop()}
          </div>
        </>
      )}
      {/* Ensure consistent height on mobile when no employee line */}
      {!showEmployee && (
        <div className="sm:hidden text-[7px] leading-tight">&nbsp;</div>
      )}
    </div>
  );
}
