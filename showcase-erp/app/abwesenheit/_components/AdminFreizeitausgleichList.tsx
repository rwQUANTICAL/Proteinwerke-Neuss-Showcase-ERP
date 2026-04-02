"use client";

import { MdCheck, MdClose, MdDelete, MdSwapHoriz } from "react-icons/md";
import { useState } from "react";
import {
  formatDateDE,
  dayCount,
} from "@/app/lib/entities/krankmeldung/krankmeldungHooks";
import {
  useAllFreizeitausgleichAntraegeQuery,
  usePatchFreizeitausgleichMutation,
  useDeleteFreizeitausgleichMutation,
  type FreizeitausgleichAntrag,
} from "@/app/lib/entities/freizeitausgleich/freizeitausgleichHooks";

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  BEANTRAGT: { className: "badge-warning", label: "Beantragt" },
  GENEHMIGT: { className: "badge-success", label: "Genehmigt" },
  ABGELEHNT: { className: "badge-error", label: "Abgelehnt" },
};

export default function AdminFreizeitausgleichList() {
  const { data: antraege, isLoading } = useAllFreizeitausgleichAntraegeQuery();
  const patchMutation = usePatchFreizeitausgleichMutation();
  const deleteMutation = useDeleteFreizeitausgleichMutation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleApprove = (id: string) =>
    patchMutation.mutate({ id, status: "GENEHMIGT" });

  const handleReject = (id: string) =>
    patchMutation.mutate({ id, status: "ABGELEHNT" });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!antraege?.length) {
    return (
      <p className="text-base-content/50 text-sm py-6 text-center">
        Keine Freizeitausgleich-Anträge vorhanden.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {antraege.map((a: FreizeitausgleichAntrag) => {
        const days = dayCount(a.von, a.bis);
        const badge = STATUS_BADGE[a.status];
        const isPending = a.status === "BEANTRAGT";
        const isConfirmingDelete = confirmDeleteId === a.id;

        return (
          <div
            key={a.id}
            className={`flex rounded-lg bg-base-200/40 px-3 py-2 ${
              isPending
                ? "flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
                : "items-center gap-3"
            }`}
          >
            <div className="hidden sm:flex size-10 rounded-full bg-info/10 items-center justify-center shrink-0">
              <MdSwapHoriz className="size-5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {a.mitarbeiter.name}
                </span>
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

            <div className="shrink-0 flex gap-1">
              {isPending && (
                <>
                  <button
                    type="button"
                    className="btn btn-success btn-xs sm:btn-sm"
                    onClick={() => handleApprove(a.id)}
                    disabled={patchMutation.isPending}
                    title="Genehmigen"
                  >
                    <MdCheck className="size-3.5 sm:size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-error btn-xs sm:btn-sm"
                    onClick={() => handleReject(a.id)}
                    disabled={patchMutation.isPending}
                    title="Ablehnen"
                  >
                    <MdClose className="size-3.5 sm:size-4" />
                  </button>
                </>
              )}

              {isConfirmingDelete ? (
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    className="btn btn-error btn-xs sm:btn-sm"
                    onClick={() => handleDelete(a.id)}
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
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Nein
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs sm:btn-sm text-error"
                  onClick={() => setConfirmDeleteId(a.id)}
                  title="Löschen"
                >
                  <MdDelete className="size-3.5 sm:size-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
