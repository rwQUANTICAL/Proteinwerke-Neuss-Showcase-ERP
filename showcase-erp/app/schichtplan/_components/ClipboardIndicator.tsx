"use client";

import { MdContentCopy, MdClose } from "react-icons/md";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_COLORS,
  TEILANLAGE_LABELS,
  NON_WORKING_SCHICHT_TYPEN,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";

interface ClipboardIndicatorProps {
  clipboard: { schicht: string; teilanlage: string };
  onClear: () => void;
}

export default function ClipboardIndicator({
  clipboard,
  onClear,
}: ClipboardIndicatorProps) {
  const colors = SCHICHT_TYP_COLORS[clipboard.schicht];
  const schichtLabel =
    SCHICHT_TYP_LABELS[clipboard.schicht] ?? clipboard.schicht;
  const anlageLabel =
    TEILANLAGE_LABELS[clipboard.teilanlage] ?? clipboard.teilanlage;
  const isNonWorking = (
    NON_WORKING_SCHICHT_TYPEN as readonly string[]
  ).includes(clipboard.schicht);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/10 border border-info/20 text-sm">
      <MdContentCopy className="size-4 text-info shrink-0" />
      <span className="text-base-content/70">Kopiert:</span>
      <span
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${colors?.bg ?? "bg-base-200"} ${colors?.text ?? "text-base-content"}`}
      >
        {schichtLabel}
      </span>
      {!isNonWorking && (
        <>
          <span className="text-base-content/40">·</span>
          <span className="text-xs text-base-content/60">{anlageLabel}</span>
        </>
      )}
      <button
        type="button"
        className="ml-auto size-5 rounded-full hover:bg-base-300 flex items-center justify-center text-base-content/40 hover:text-base-content/70 transition-colors"
        onClick={onClear}
        aria-label="Zwischenablage leeren"
      >
        <MdClose className="size-3.5" />
      </button>
    </div>
  );
}
