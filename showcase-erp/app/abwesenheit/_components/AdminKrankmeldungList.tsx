"use client";

import { useState } from "react";
import { MdDelete, MdLocalHospital } from "react-icons/md";
import {
  useAllKrankmeldungenQuery,
  useDeleteKrankmeldungMutation,
  formatDateDE,
  dayCount,
  type Krankmeldung,
} from "@/app/lib/entities/krankmeldung/krankmeldungHooks";

export default function AdminKrankmeldungList() {
  const { data: krankmeldungen, isLoading } = useAllKrankmeldungenQuery();
  const deleteMutation = useDeleteKrankmeldungMutation();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
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

  if (!krankmeldungen?.length) {
    return (
      <p className="text-base-content/50 text-sm py-6 text-center">
        Keine Krankmeldungen vorhanden.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {krankmeldungen.map((km: Krankmeldung) => {
        const days = dayCount(km.von, km.bis);
        const isConfirming = confirmId === km.id;

        return (
          <div
            key={km.id}
            className="flex items-center gap-3 rounded-lg bg-base-200/40 px-3 py-2"
          >
            <div className="hidden sm:flex size-10 rounded-full bg-error/10 items-center justify-center shrink-0">
              <MdLocalHospital className="size-5 text-error" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm truncate block">
                {km.mitarbeiter.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-base-content/60">
                <span>
                  {formatDateDE(km.von)} – {formatDateDE(km.bis)}
                </span>
                <span className="badge badge-xs badge-ghost">
                  {days} {days === 1 ? "Tag" : "Tage"}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              {isConfirming ? (
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    className="btn btn-error btn-xs sm:btn-sm"
                    onClick={() => handleDelete(km.id)}
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
                  onClick={() => setConfirmId(km.id)}
                  title="Krankmeldung löschen"
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
