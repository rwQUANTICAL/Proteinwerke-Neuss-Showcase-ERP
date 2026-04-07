"use client";

import { MdCheck, MdClose } from "react-icons/md";
import LoadingLogo from "@/app/components/LoadingLogo";

interface VorschlagToolbarProps {
  count: number;
  onAcceptAll: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function VorschlagToolbar({
  count,
  onAcceptAll,
  onCancel,
  isSaving,
}: VorschlagToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="btn btn-primary btn-xs sm:btn-sm gap-1"
        onClick={onAcceptAll}
        disabled={isSaving || count === 0}
      >
        {isSaving ? <LoadingLogo size={16} /> : <MdCheck className="size-4" />}
        Alle übernehmen
      </button>
      <button
        className="btn btn-ghost btn-xs sm:btn-sm text-base-content/50"
        onClick={onCancel}
        disabled={isSaving}
      >
        <MdClose className="size-3.5" />
        Abbrechen
      </button>
    </div>
  );
}
