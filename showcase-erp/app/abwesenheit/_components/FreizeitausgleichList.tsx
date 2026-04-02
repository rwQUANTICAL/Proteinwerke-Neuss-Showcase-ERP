"use client";

import { MdSwapHoriz, MdClose } from "react-icons/md";
import {
  formatDateDE,
  dayCount,
} from "@/app/lib/entities/krankmeldung/krankmeldungHooks";
import {
  useFreizeitausgleichAntraegeQuery,
  useDeleteFreizeitausgleichMutation,
  type FreizeitausgleichAntrag,
} from "@/app/lib/entities/freizeitausgleich/freizeitausgleichHooks";
import { useState } from "react";

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  BEANTRAGT: { className: "badge-warning", label: "Beantragt" },
  GENEHMIGT: { className: "badge-success", label: "Genehmigt" },
  ABGELEHNT: { className: "badge-error", label: "Abgelehnt" },
};

export default function FreizeitausgleichList() {
  const { data: antraege, isLoading } = useFreizeitausgleichAntraegeQuery();
  const deleteMutation = useDeleteFreizeitausgleichMutation();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleWithdraw = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setConfirmId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!antraege?.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {antraege.map((a: FreizeitausgleichAntrag) => {
        const days = dayCount(a.von, a.bis);
        const badge = STATUS_BADGE[a.status];
        const canWithdraw = a.status === "BEANTRAGT";
        const isConfirming = confirmId === a.id;

        return (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-lg bg-base-200/40 px-3 py-2"
          >
            <div className="hidden sm:flex size-10 rounded-full bg-info/10 items-center justify-center shrink-0">
              <MdSwapHoriz className="size-5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`badge badge-xs ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-base-content/60">
                <span>
                  {formatDateDE(a.von)} – {formatDateDE(a.bis)}
                </span>
                <span className="badge badge-xs badge-ghost">
                  {days} {days === 1 ? "Tag" : "Tage"}
                </span>
              </div>
            </div>

            {canWithdraw && (
              <div className="shrink-0">
                {isConfirming ? (
                  <div className="flex gap-1 items-center">
                    <button
                      type="button"
                      className="btn btn-error btn-xs sm:btn-sm"
                      onClick={() => handleWithdraw(a.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Ja"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs sm:btn-sm"
                      onClick={() => setConfirmId(null)}
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs sm:btn-sm text-error"
                    onClick={() => setConfirmId(a.id)}
                    title="Antrag zurückziehen"
                  >
                    <MdClose className="size-3.5 sm:size-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
