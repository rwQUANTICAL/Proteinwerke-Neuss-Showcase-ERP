"use client";

import { MdLocalHospital } from "react-icons/md";
import {
  useKrankmeldungenQuery,
  type Krankmeldung,
} from "@/app/lib/entities/krankmeldung/krankmeldungHooks";

function formatDateDE(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function dayCount(von: string, bis: string): number {
  const start = new Date(von);
  const end = new Date(bis);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export default function KrankmeldungList() {
  const { data: krankmeldungen, isLoading } = useKrankmeldungenQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!krankmeldungen?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {krankmeldungen.map((km: Krankmeldung) => {
        const days = dayCount(km.von, km.bis);

        return (
          <div key={km.id} className="card card-border bg-base-100">
            <div className="card-body p-4 sm:p-6 flex-row items-center gap-4">
              <div className="hidden sm:flex size-10 rounded-full bg-error/10 items-center justify-center shrink-0">
                <MdLocalHospital className="size-5 text-error" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-base-content/70">
                  {formatDateDE(km.von)} – {formatDateDE(km.bis)}
                  <span className="badge badge-sm badge-ghost ml-2">
                    {days} {days === 1 ? "Tag" : "Tage"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
