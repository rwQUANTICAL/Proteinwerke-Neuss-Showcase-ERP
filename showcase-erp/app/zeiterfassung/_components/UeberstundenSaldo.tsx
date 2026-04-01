"use client";

import { MdInfoOutline } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
  SOLL_STUNDEN_PRO_SCHICHT,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  weekEntries: ZeitbuchungEntry[];
  allEntries: ZeitbuchungEntry[];
}

function fmtHM(hours: number): string {
  const sign = hours < 0 ? "−" : "";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Stunden`;
}

export default function Zeitkonto({ weekEntries, allEntries }: Props) {
  let weekIst = 0;
  for (const e of weekEntries) weekIst += calcNettoStunden(e);
  const weekSoll = weekEntries.length * SOLL_STUNDEN_PRO_SCHICHT;
  const weekSaldo = weekIst - weekSoll;

  let totalIst = 0;
  for (const e of allEntries) totalIst += calcNettoStunden(e);
  const totalSoll = allEntries.length * SOLL_STUNDEN_PRO_SCHICHT;
  const totalSaldo = totalIst - totalSoll;

  const rows = [
    { label: "Wochensaldo", value: weekSaldo },
    { label: "Gesamtsaldo", value: totalSaldo },
  ];

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
            Zeitkonto
          </h3>
          <div className="tooltip tooltip-left" data-tip={`${allEntries.length} Schichten erfasst`}>
            <MdInfoOutline className="size-4 text-base-content/30" />
          </div>
        </div>
        <div className="divide-y divide-base-200">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3"
            >
              <span className="text-sm text-base-content/60">{row.label}</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  row.value >= 0 ? "text-success" : "text-error"
                }`}
              >
                {fmtHM(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
