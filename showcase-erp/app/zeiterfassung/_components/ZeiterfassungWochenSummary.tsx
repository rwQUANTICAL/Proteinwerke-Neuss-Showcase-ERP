"use client";

import { MdTrendingUp, MdTrendingDown, MdAccessTime } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
  SOLL_STUNDEN_PRO_SCHICHT,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  entries: ZeitbuchungEntry[];
}

export default function ZeiterfassungWochenSummary({ entries }: Props) {
  let istGesamt = 0;
  for (const entry of entries) {
    istGesamt += calcNettoStunden(entry);
  }
  // Soll = 8h per worked shift (per entry)
  const sollGesamt = entries.length * SOLL_STUNDEN_PRO_SCHICHT;
  const diff = istGesamt - sollGesamt;
  const isPositive = diff >= 0;

  const stats = [
    {
      label: "Ist-Stunden",
      value: `${istGesamt.toFixed(1)} Std.`,
      icon: MdAccessTime,
      accent: "text-primary",
    },
    {
      label: "Soll-Stunden",
      value: `${sollGesamt.toFixed(1)} Std.`,
      icon: MdAccessTime,
      accent: "text-base-content/70",
    },
    {
      label: isPositive ? "Überstunden" : "Defizit",
      value: `${isPositive ? "+" : ""}${diff.toFixed(1)} Std.`,
      icon: isPositive ? MdTrendingUp : MdTrendingDown,
      accent: isPositive ? "text-success" : "text-error",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card bg-base-100 border border-base-300 shadow-sm"
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={`size-5 ${stat.accent}`} />
              <span className="text-xs text-base-content/50 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${stat.accent}`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
